-- ============================================================
-- ESQUEMA DE GRADOS INFORMÁTICOS
-- ============================================================
--
-- IMPORTANTE:
-- El repositorio de invitados/público se guarda UNA SOLA VEZ en:
--   "grados-informaticos".configuracion_publica
--   clave = gh_repo
--
-- El código obtiene de ahí el repositorio público tanto para invitados
-- (Service Worker) como para el administrador (permisos.js).
-- NO se utiliza gh_repo_publico en configuracion_privada.
--
-- ============================================================

create schema if not exists "grados-informaticos";

-- La visibilidad ya NO se guarda en tablas de filas/archivos.
-- Si existen de una instalación anterior, se eliminan.
drop table if exists "grados-informaticos".archivos cascade;
drop table if exists "grados-informaticos".filas cascade;

-- ============================================================
-- 1. PERFILES
-- ============================================================

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  rol text not null default 'invitado'
    check (rol in ('admin', 'invitado')),
  creado_en timestamptz not null default now()
);

-- ============================================================
-- CONFIGURACIÓN PRIVADA

--
-- Aquí SOLO va la configuración del administrador.
-- gh_repo = repositorio privado del administrador.
-- gh_token = token del administrador.
--
-- NO existe gh_repo_publico aquí.
-- ============================================================

create table if not exists "grados-informaticos".configuracion_privada (
  clave text primary key,
  valor text not null
);

-- ============================================================
-- 5. CONFIGURACIÓN PÚBLICA
--
-- Aquí está la ÚNICA fuente del repositorio de invitados.
-- ============================================================

create table if not exists "grados-informaticos".configuracion_publica (
  clave text primary key,
  valor text not null
);

-- ============================================================
-- 6. FUNCIÓN DE ROL
-- ============================================================

create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.rol
      from public.perfiles p
      where p.id = auth.uid()
      limit 1
    ),
    'invitado'
  );
$$;

-- ============================================================
-- 7. TRIGGER DE PERFIL
-- ============================================================

create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rol_asignar text := 'invitado';
begin
  if new.email ilike '%nataliagbarea%'
     or new.email ilike '%nataliagamezbarea%'
     or new.email ilike '%natalia%' then
    rol_asignar := 'admin';
  end if;

  insert into public.perfiles (id, email, rol)
  values (new.id, new.email, rol_asignar)
  on conflict (id) do update
  set
    email = excluded.email,
    rol = case
      when excluded.email ilike '%nataliagbarea%'
        or excluded.email ilike '%nataliagamezbarea%'
        or excluded.email ilike '%natalia%'
      then 'admin'
      else public.perfiles.rol
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.manejar_nuevo_usuario();

-- ============================================================
-- 8. RLS
-- ============================================================

alter table public.perfiles enable row level security;
alter table "grados-informaticos".configuracion_privada enable row level security;
alter table "grados-informaticos".configuracion_publica enable row level security;

-- ============================================================
-- 9. POLÍTICAS DE PERFILES
-- ============================================================

drop policy if exists "leer perfil propio" on public.perfiles;
create policy "leer perfil propio"
on public.perfiles
for select
 to authenticated
using (auth.uid() = id);

-- ============================================================
-- POLÍTICAS DE CONFIGURACIÓN PRIVADA
-- ============================================================

drop policy if exists "admin autenticado lee privada"
on "grados-informaticos".configuracion_privada;
create policy "admin autenticado lee privada"
on "grados-informaticos".configuracion_privada
for select
 to authenticated
using (public.rol_actual() = 'admin');

drop policy if exists "admin autenticado escribe privada"
on "grados-informaticos".configuracion_privada;
create policy "admin autenticado escribe privada"
on "grados-informaticos".configuracion_privada
for all
 to authenticated
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

-- ============================================================
-- 13. POLÍTICAS DE CONFIGURACIÓN PÚBLICA
--
-- El Service Worker lee únicamente gh_repo de configuracion_publica.
-- El repositorio público es público de verdad; el token privado jamás se publica.
-- ============================================================

drop policy if exists "anon lee configuracion publica"
on "grados-informaticos".configuracion_publica;
create policy "anon lee configuracion publica"
on "grados-informaticos".configuracion_publica
for select
 to anon
using (true);

drop policy if exists "authenticated lee configuracion publica"
on "grados-informaticos".configuracion_publica;
create policy "authenticated lee configuracion publica"
on "grados-informaticos".configuracion_publica
for select
 to authenticated
using (true);

drop policy if exists "admin autenticado escribe publica"
on "grados-informaticos".configuracion_publica;
create policy "admin autenticado escribe publica"
on "grados-informaticos".configuracion_publica
for all
  to authenticated
  using (public.rol_actual() = 'admin')
  with check (public.rol_actual() = 'admin');

-- ============================================================
-- IMPORTANTE: NO SE CREA NINGUNA VISTA EN public
-- configuracion_publica existe UNICAMENTE como tabla dentro de
-- "grados-informaticos" y se accede indicando Accept-Profile:
-- grados-informaticos.
-- Si existía una vista antigua, se elimina.
-- ============================================================

drop view if exists public.configuracion_publica;

-- ============================================================
-- 14. GRANTS
-- ============================================================

grant usage on schema "grados-informaticos"
to anon, authenticated, service_role;


grant select, insert, update, delete
on "grados-informaticos".configuracion_privada
to authenticated, service_role;

grant select
on "grados-informaticos".configuracion_publica
to anon;

grant select, insert, update, delete
on "grados-informaticos".configuracion_publica
to authenticated, service_role;


-- ============================================================
-- 15. CONFIGURACIÓN INICIAL
-- ============================================================
--
-- REPO PRIVADO DEL ADMIN:
--   gh_repo
--   gh_token
--
-- REPO DE INVITADOS/PÚBLICO:
--   gh_repo   (solo el nombre del repositorio público)
--
-- El token de escritura permanece EXCLUSIVAMENTE en configuracion_privada.
-- ============================================================

insert into "grados-informaticos".configuracion_privada (clave, valor)
values
  ('gh_repo', 'nataliagamezbarea/GRADOS_INFORMATICOS'),
  ('gh_token', 'AQUI_TU_TOKEN_DEL_ADMIN'),
  ('modo_oscuro', 'true'),
  ('invitados_activos', 'true'),
  ('descargar_curso', 'true'),
  ('descargar_todas_clases', 'true'),
  ('descargar_asignatura', 'true'),
  ('descargar_asignatura_todos', 'true'),
  ('visor_activo', 'true'),
  ('visor_en_tareas', 'true'),
  ('visor_en_asignaturas', 'true'),
  ('visor_en_trimestres', 'true'),
  ('visor_en_grados', 'true')
on conflict (clave) do update
set valor = excluded.valor;

insert into "grados-informaticos".configuracion_publica (clave, valor)
values
  ('gh_repo', 'nataliagamezbarea/grados_informaticos_public')
on conflict (clave) do update
set valor = excluded.valor;

-- ============================================================
-- 16. SINCRONIZAR USUARIOS EXISTENTES
-- ============================================================

insert into public.perfiles (id, email, rol)
select
  id,
  email,
  case
    when email ilike '%nataliagbarea%'
      or email ilike '%nataliagamezbarea%'
      or email ilike '%natalia%'
    then 'admin'
    else 'invitado'
  end
from auth.users
on conflict (id) do update
set
  email = excluded.email,
  rol = case
    when excluded.email ilike '%nataliagbarea%'
      or excluded.email ilike '%nataliagamezbarea%'
      or excluded.email ilike '%natalia%'
    then 'admin'
    else public.perfiles.rol
  end;

-- ============================================================
-- FIN
-- ============================================================
