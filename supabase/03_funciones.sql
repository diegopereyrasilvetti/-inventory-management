-- =====================================================================
-- Gestión de Stock - Etapa 4, paso 3: operaciones de stock "todo o nada"
-- Se pega y ejecuta una sola vez en Supabase > SQL Editor, DESPUÉS de 01 y 02.
-- Es seguro correrlo de nuevo: usa "create or replace".
--
-- Por qué funciones en la base:
--   Una función de Postgres se ejecuta COMPLETA o NO SE EJECUTA (es una transacción).
--   Vender = crear la venta + guardar los ítems + bajar el stock + anotar el movimiento.
--   Si algo falla a la mitad, no queda nada guardado. Y dos ventas al mismo tiempo no
--   pueden vender el mismo stock dos veces (la fila se bloquea con "for update").
--
-- "security invoker": la función corre con los permisos del usuario que la llama, así
-- las reglas por usuario (RLS) siguen valiendo: nadie toca productos ajenos.
--
-- Códigos de error propios (los usa la API para responder bien):
--   GS001 = datos inválidos   GS002 = no encontrado   GS003 = stock insuficiente
-- =====================================================================

-- ---------- 1) Ajustar stock de un producto (suma o resta) ----------
create or replace function public.ajustar_stock(p_producto bigint, p_cantidad integer, p_motivo text default null)
returns public.productos
language plpgsql
security invoker
set search_path = public
as $$
declare
  v public.productos;
begin
  if p_cantidad is null or p_cantidad = 0 then
    raise exception 'La cantidad no puede ser 0.' using errcode = 'GS001';
  end if;

  -- "for update" bloquea la fila hasta terminar: nadie más la cambia mientras tanto
  select * into v from public.productos where id = p_producto for update;
  if not found then
    raise exception 'Producto no encontrado.' using errcode = 'GS002';
  end if;

  if v.stock + p_cantidad < 0 then
    raise exception 'Stock insuficiente de "%": hay % y se quieren sacar %.', v.nombre, v.stock, -p_cantidad
      using errcode = 'GS003';
  end if;

  update public.productos set stock = stock + p_cantidad where id = p_producto returning * into v;

  insert into public.movimientos_stock (producto_id, tipo, cantidad, motivo)
  values (p_producto, case when p_cantidad > 0 then 'entrada' else 'salida' end, p_cantidad, coalesce(nullif(trim(p_motivo), ''), 'Ajuste manual'));

  return v;
end;
$$;

-- ---------- 2) Registrar una venta ----------
-- p_items: [{"producto_id": 1, "cantidad": 2}, ...]
-- El precio y el nombre se toman de la base (no del navegador), así nadie puede inventar un precio.
create or replace function public.registrar_venta(p_fecha date, p_metodo text, p_items jsonb)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_venta bigint;
  v_total numeric(12, 2) := 0;
  r record;
  p public.productos;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta necesita al menos un producto.' using errcode = 'GS001';
  end if;

  insert into public.ventas (fecha, metodo, total)
  values (coalesce(p_fecha, current_date), p_metodo, 0)
  returning id into v_venta;

  -- Si el mismo producto viene dos veces se suman; "order by" evita bloqueos cruzados entre ventas
  for r in
    select (i ->> 'producto_id')::bigint as producto_id, sum((i ->> 'cantidad')::integer) as cantidad
    from jsonb_array_elements(p_items) as i
    group by 1
    order by 1
  loop
    if r.producto_id is null or r.cantidad is null or r.cantidad < 1 then
      raise exception 'Cada producto necesita una cantidad de 1 o más.' using errcode = 'GS001';
    end if;

    select * into p from public.productos where id = r.producto_id for update;
    if not found then
      raise exception 'Producto no encontrado.' using errcode = 'GS002';
    end if;
    if p.precio is null then
      raise exception 'El producto "%" no tiene precio cargado.', p.nombre using errcode = 'GS001';
    end if;
    if p.stock < r.cantidad then
      raise exception 'Stock insuficiente de "%": quedan % y querés vender %.', p.nombre, p.stock, r.cantidad
        using errcode = 'GS003';
    end if;

    insert into public.venta_items (venta_id, producto_id, sku, nombre, precio, cantidad)
    values (v_venta, p.id, p.sku, p.nombre, p.precio, r.cantidad);

    update public.productos set stock = stock - r.cantidad where id = p.id;

    insert into public.movimientos_stock (producto_id, tipo, cantidad, motivo)
    values (p.id, 'venta', -r.cantidad, 'Venta #' || v_venta);

    v_total := v_total + p.precio * r.cantidad;
  end loop;

  update public.ventas set total = v_total where id = v_venta;
  return v_venta;
end;
$$;

-- ---------- 3) Eliminar una venta y devolver el stock ----------
create or replace function public.eliminar_venta(p_venta bigint)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  r record;
begin
  perform 1 from public.ventas where id = p_venta for update;
  if not found then
    raise exception 'Venta no encontrada.' using errcode = 'GS002';
  end if;

  -- Se devuelve el stock de los productos que todavía existen
  for r in
    select producto_id, cantidad from public.venta_items
    where venta_id = p_venta and producto_id is not null
    order by producto_id
  loop
    update public.productos set stock = stock + r.cantidad where id = r.producto_id;
    if found then
      insert into public.movimientos_stock (producto_id, tipo, cantidad, motivo)
      values (r.producto_id, 'entrada', r.cantidad, 'Venta #' || p_venta || ' eliminada');
    end if;
  end loop;

  delete from public.ventas where id = p_venta; -- los ítems se borran solos (on delete cascade)
end;
$$;

-- ---------- Permisos: solo usuarios con sesión iniciada pueden ejecutarlas ----------
revoke all on function public.ajustar_stock(bigint, integer, text) from public, anon;
revoke all on function public.registrar_venta(date, text, jsonb) from public, anon;
revoke all on function public.eliminar_venta(bigint) from public, anon;
grant execute on function public.ajustar_stock(bigint, integer, text) to authenticated;
grant execute on function public.registrar_venta(date, text, jsonb) to authenticated;
grant execute on function public.eliminar_venta(bigint) to authenticated;
