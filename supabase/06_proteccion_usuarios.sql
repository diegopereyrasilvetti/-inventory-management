-- =====================================================================
-- Gestión de Stock - Panel de administración, paso 1: protecciones al borrar o cambiar personas
-- Se pega y ejecuta una sola vez en Supabase > SQL Editor, DESPUÉS de 01 a 05.
-- Es seguro correrlo de nuevo.
--
-- 1) Los datos son de la empresa, no de quien los cargó. Si se elimina una cuenta, lo que esa
--    persona cargó (productos, ventas, gastos...) se CONSERVA: solo se borra la marca de "quién lo cargó".
--    Antes la base borraba todo eso junto con la cuenta.
--
-- 2) Nunca se puede dejar la empresa sin un administrador activo: la base rechaza desactivar,
--    quitarle el rol o eliminar al último administrador.
-- =====================================================================

-- ---------- 1) Eliminar una cuenta no elimina los datos de la empresa ----------
do $$
declare
  tabla text;
  restriccion text;
begin
  foreach tabla in array array['proveedores', 'productos', 'movimientos_stock', 'ventas', 'venta_items', 'gastos'] loop
    -- user_id pasa a poder quedar vacío (cuenta eliminada)
    execute format('alter table public.%I alter column user_id drop not null', tabla);

    -- se quita la regla vieja (borrar en cascada) y se pone "dejar vacío"
    for restriccion in
      select conname from pg_constraint
      where conrelid = format('public.%I', tabla)::regclass
        and contype = 'f'
        and confrelid = 'auth.users'::regclass
    loop
      execute format('alter table public.%I drop constraint %I', tabla, restriccion);
    end loop;

    execute format(
      'alter table public.%I add constraint %I foreign key (user_id) references auth.users (id) on delete set null',
      tabla, tabla || '_user_id_fkey'
    );
  end loop;
end;
$$;

-- ---------- 2) Siempre tiene que quedar al menos un administrador activo ----------
create or replace function public.proteger_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.rol = 'admin' and old.activo then
    if tg_op = 'DELETE' or new.rol <> 'admin' or not new.activo then
      if not exists (select 1 from public.perfiles where id <> old.id and rol = 'admin' and activo) then
        raise exception 'No se puede dejar la empresa sin un administrador activo.' using errcode = 'GS004';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_ultimo_admin on public.perfiles;
create trigger proteger_ultimo_admin
  before update or delete on public.perfiles
  for each row execute function public.proteger_ultimo_admin();

-- ---------- 3) La API de administración necesita permiso sobre la tabla de perfiles ----------
-- Las rutas de "Personas" usan la clave "secret" de Supabase (rol service_role). Como las tablas
-- nuevas no se exponen solas, hay que darle acceso a perfiles de forma explícita.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on public.perfiles to service_role;
  end if;
end;
$$;
