-- =====================================================================
-- Gestión de Stock - Accesos por invitación, paso 1: perfiles y roles
-- Se pega y ejecuta una sola vez en Supabase > SQL Editor, DESPUÉS de 01, 02 y 03.
-- Es seguro correrlo de nuevo.
--
-- Idea: el registro público se apaga. Las cuentas las crea el administrador y cada
-- cuenta tiene un "perfil" con su rol:
--   admin   -> administra a las demás personas
--   usuario -> usa el panel
-- Solo puede entrar quien tenga perfil y esté activo.
-- =====================================================================

-- ---------- Tabla de perfiles (1 por cuenta) ----------
create table if not exists public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  nombre     text,
  rol        text not null default 'usuario' check (rol in ('admin', 'usuario')),
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.perfiles enable row level security;

-- ---------- Funciones de ayuda ----------
-- "security definer": consultan la tabla con permisos del dueño, así no se enredan con las
-- reglas de la propia tabla perfiles (evita una referencia circular).
create or replace function public.es_miembro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and activo);
$$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and activo and rol = 'admin');
$$;

-- ---------- Reglas de la tabla perfiles ----------
-- Cada persona ve su propio perfil; el admin ve el de todos y puede modificarlos.
drop policy if exists "perfiles: ver el propio o todos si es admin" on public.perfiles;
create policy "perfiles: ver el propio o todos si es admin" on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()) or public.es_admin());

drop policy if exists "perfiles: solo el admin modifica" on public.perfiles;
create policy "perfiles: solo el admin modifica" on public.perfiles
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- Sin sesión no hay acceso; con sesión solo se puede leer y (el admin) modificar.
-- Los perfiles se crean solos con el disparador de más abajo, no a mano desde la web.
revoke all on public.perfiles from anon;
grant select, update on public.perfiles to authenticated;

-- ---------- Perfil automático para cada cuenta nueva ----------
-- Cuando el admin crea un usuario en Supabase, se le arma un perfil con rol "usuario".
create or replace function public.crear_perfil_para_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists crear_perfil_al_registrar on auth.users;
create trigger crear_perfil_al_registrar
  after insert on auth.users
  for each row execute function public.crear_perfil_para_usuario_nuevo();

-- ---------- Perfiles para las cuentas que ya existen ----------
insert into public.perfiles (id, email, nombre)
select id, email, coalesce(nullif(trim(raw_user_meta_data ->> 'nombre'), ''), split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- =====================================================================
-- PASO MANUAL: elegir quién es administrador.
-- Después de correr este archivo, ejecutá esto (cambiando el email por el tuyo):
--
--   update public.perfiles set rol = 'admin' where email = 'tu-email@ejemplo.com';
--
-- =====================================================================
