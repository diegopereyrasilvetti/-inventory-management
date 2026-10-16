-- =====================================================================
-- Gestión de Stock - Accesos por invitación, paso 2: datos compartidos por la empresa
-- Se pega y ejecuta una sola vez en Supabase > SQL Editor, DESPUÉS de 01, 02, 03 y 04.
-- Es seguro correrlo de nuevo.
--
-- Antes: cada cuenta veía solo las filas donde user_id era la suya.
-- Ahora: la empresa es una sola. TODAS las cuentas activas (con perfil activo) ven y
-- editan los mismos productos, proveedores, ventas, gastos y movimientos.
--
-- La columna user_id se mantiene y pasa a significar "quién lo cargó".
-- Quien no tiene perfil, o tiene el perfil desactivado, no ve ni modifica nada.
-- =====================================================================

-- ---------- Reglas nuevas: miembros activos de la empresa ----------
-- es_miembro() está definida en 04_perfiles.sql

-- Proveedores
drop policy if exists "proveedores: solo el dueño" on public.proveedores;
drop policy if exists "proveedores: miembros de la empresa" on public.proveedores;
create policy "proveedores: miembros de la empresa" on public.proveedores
  for all to authenticated
  using      (public.es_miembro())
  with check (public.es_miembro());

-- Productos: además, el proveedor elegido tiene que existir
drop policy if exists "productos: solo el dueño" on public.productos;
drop policy if exists "productos: miembros de la empresa" on public.productos;
create policy "productos: miembros de la empresa" on public.productos
  for all to authenticated
  using      (public.es_miembro())
  with check (
    public.es_miembro()
    and (proveedor_id is null or exists (select 1 from public.proveedores p where p.id = proveedor_id))
  );

-- Movimientos de stock: el producto tiene que existir
drop policy if exists "movimientos_stock: solo el dueño" on public.movimientos_stock;
drop policy if exists "movimientos_stock: miembros de la empresa" on public.movimientos_stock;
create policy "movimientos_stock: miembros de la empresa" on public.movimientos_stock
  for all to authenticated
  using      (public.es_miembro())
  with check (
    public.es_miembro()
    and exists (select 1 from public.productos pr where pr.id = producto_id)
  );

-- Ventas
drop policy if exists "ventas: solo el dueño" on public.ventas;
drop policy if exists "ventas: miembros de la empresa" on public.ventas;
create policy "ventas: miembros de la empresa" on public.ventas
  for all to authenticated
  using      (public.es_miembro())
  with check (public.es_miembro());

-- Ítems de venta: la venta (y el producto, si lo hay) tienen que existir
drop policy if exists "venta_items: solo el dueño" on public.venta_items;
drop policy if exists "venta_items: miembros de la empresa" on public.venta_items;
create policy "venta_items: miembros de la empresa" on public.venta_items
  for all to authenticated
  using      (public.es_miembro())
  with check (
    public.es_miembro()
    and exists (select 1 from public.ventas v where v.id = venta_id)
    and (producto_id is null or exists (select 1 from public.productos pr where pr.id = producto_id))
  );

-- Gastos
drop policy if exists "gastos: solo el dueño" on public.gastos;
drop policy if exists "gastos: miembros de la empresa" on public.gastos;
create policy "gastos: miembros de la empresa" on public.gastos
  for all to authenticated
  using      (public.es_miembro())
  with check (public.es_miembro());

-- ---------- El código (SKU) de un producto es único en TODA la empresa ----------
-- Antes era único por usuario. Si dos personas cargaran el mismo código serían dos productos distintos.
alter table public.productos drop constraint if exists productos_user_id_sku_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'productos_sku_key' and conrelid = 'public.productos'::regclass) then
    alter table public.productos add constraint productos_sku_key unique (sku);
  end if;
end;
$$;
