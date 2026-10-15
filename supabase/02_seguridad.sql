-- =====================================================================
-- Gestión de Stock - Etapa 3, paso 3: seguridad (RLS)
-- Se pega y ejecuta una sola vez en Supabase > SQL Editor, DESPUÉS de 01_tablas.sql.
-- Es seguro correrlo de nuevo: borra y vuelve a crear las políticas.
--
-- Cómo funciona, en dos capas:
--   1) GRANT  : qué rol puede tocar la tabla. Solo "authenticated" (usuarios que
--               iniciaron sesión). "anon" (cualquiera sin login) queda afuera.
--   2) POLICY : qué FILAS puede ver o modificar cada usuario. La regla es siempre
--               la misma: user_id tiene que ser el del usuario logueado.
-- =====================================================================

-- ---------- 1) Permisos: solo usuarios con sesión iniciada ----------
grant select, insert, update, delete on
  public.proveedores,
  public.productos,
  public.movimientos_stock,
  public.ventas,
  public.venta_items,
  public.gastos
to authenticated;

-- ---------- 2) Políticas: cada usuario ve y modifica solo lo suyo ----------
-- (select auth.uid()) en vez de auth.uid() a secas: Postgres lo calcula una vez por consulta y no por fila.

-- Proveedores
drop policy if exists "proveedores: solo el dueño" on public.proveedores;
create policy "proveedores: solo el dueño" on public.proveedores
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Productos: además, el proveedor elegido tiene que ser del mismo usuario
-- (dentro del exists, RLS ya filtra proveedores y solo se ven los propios).
drop policy if exists "productos: solo el dueño" on public.productos;
create policy "productos: solo el dueño" on public.productos
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (proveedor_id is null or exists (select 1 from public.proveedores p where p.id = proveedor_id))
  );

-- Movimientos de stock: el producto tiene que ser del mismo usuario
drop policy if exists "movimientos_stock: solo el dueño" on public.movimientos_stock;
create policy "movimientos_stock: solo el dueño" on public.movimientos_stock
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.productos pr where pr.id = producto_id)
  );

-- Ventas
drop policy if exists "ventas: solo el dueño" on public.ventas;
create policy "ventas: solo el dueño" on public.ventas
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Ítems de venta: la venta (y el producto, si lo hay) tienen que ser del mismo usuario
drop policy if exists "venta_items: solo el dueño" on public.venta_items;
create policy "venta_items: solo el dueño" on public.venta_items
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.ventas v where v.id = venta_id)
    and (producto_id is null or exists (select 1 from public.productos pr where pr.id = producto_id))
  );

-- Gastos
drop policy if exists "gastos: solo el dueño" on public.gastos;
create policy "gastos: solo el dueño" on public.gastos
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
