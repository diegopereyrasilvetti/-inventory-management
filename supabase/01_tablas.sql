-- =====================================================================
-- Gestión de Stock - Etapa 3, paso 2: tablas
-- Se pega y ejecuta una sola vez en Supabase > SQL Editor.
-- Es seguro correrlo de nuevo: usa "if not exists".
--
-- Convenciones:
--   * id          : número que se genera solo (1, 2, 3...).
--   * user_id     : dueño de la fila. Se completa solo con el usuario logueado
--                   (auth.uid()) y si se borra el usuario, se borran sus datos.
--   * check (...) : la base rechaza valores que no tienen sentido (stock negativo, etc.).
-- =====================================================================

-- ---------- Proveedores ----------
create table if not exists public.proveedores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre     text not null,
  rubro      text,
  contacto   text,
  telefono   text,
  email      text,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Productos (catálogo + inventario en una sola tabla) ----------
create table if not exists public.productos (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sku          text not null,                                  -- el "código" del producto
  nombre       text not null,
  categoria    text,
  marca        text,
  modelo       text,
  color        text,
  serial       text,
  precio       numeric(12, 2) check (precio >= 0),             -- puede quedar vacío
  stock        integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  proveedor_id bigint references public.proveedores (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (user_id, sku)                                        -- no repetir código dentro de un mismo usuario
);

-- ---------- Movimientos de stock (historial de cada cambio) ----------
-- cantidad con signo: positiva suma stock, negativa resta.
create table if not exists public.movimientos_stock (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  producto_id bigint not null references public.productos (id) on delete cascade,
  tipo        text not null check (tipo in ('entrada', 'salida', 'ajuste', 'venta')),
  cantidad    integer not null check (cantidad <> 0),
  motivo      text,
  created_at  timestamptz not null default now()
);

-- ---------- Ventas ----------
create table if not exists public.ventas (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha      date not null default current_date,
  metodo     text not null check (metodo in ('Efectivo', 'Transferencia', 'Tarjeta')),
  total      numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

-- Qué se vendió en cada venta. Guarda nombre y precio "al momento de vender",
-- así la venta no cambia si después editás el producto.
create table if not exists public.venta_items (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  venta_id    bigint not null references public.ventas (id) on delete cascade,
  producto_id bigint references public.productos (id) on delete set null,
  sku         text not null,
  nombre      text not null,
  precio      numeric(12, 2) not null check (precio >= 0),
  cantidad    integer not null check (cantidad > 0)
);

-- ---------- Gastos ----------
create table if not exists public.gastos (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha      date not null default current_date,
  categoria  text not null,
  detalle    text,
  monto      numeric(12, 2) not null check (monto > 0),
  created_at timestamptz not null default now()
);

-- ---------- Índices: hacen más rápidas las búsquedas más comunes ----------
create index if not exists proveedores_user_idx       on public.proveedores (user_id);
create index if not exists productos_user_idx         on public.productos (user_id);
create index if not exists productos_proveedor_idx    on public.productos (proveedor_id);
create index if not exists movimientos_producto_idx   on public.movimientos_stock (producto_id, created_at desc);
create index if not exists ventas_user_fecha_idx      on public.ventas (user_id, fecha);
create index if not exists venta_items_venta_idx      on public.venta_items (venta_id);
create index if not exists gastos_user_fecha_idx      on public.gastos (user_id, fecha);

-- ---------- Seguridad: cada tabla queda CERRADA hasta que se creen las políticas (paso 3) ----------
alter table public.proveedores       enable row level security;
alter table public.productos         enable row level security;
alter table public.movimientos_stock enable row level security;
alter table public.ventas            enable row level security;
alter table public.venta_items       enable row level security;
alter table public.gastos            enable row level security;
