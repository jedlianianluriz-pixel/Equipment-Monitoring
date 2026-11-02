-- =====================================================================
--  RECAB IT Equipment Monitoring  -  Supabase schema (run ONCE)
--  Supabase dashboard -> SQL Editor -> New query -> paste all -> Run
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- tables ----------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  role        text not null default 'user' check (role in ('admin','user')),
  active      boolean not null default false,   -- must be true to see any data
  must_change boolean not null default false,   -- force a new password at next sign-in
  created_at  timestamptz not null default now()
);

create table if not exists public.records (
  id          uuid primary key default gen_random_uuid(),
  seq         bigint generated always as identity,   -- keeps the newest-first order
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);
create index if not exists records_seq_idx on public.records (seq desc);

create table if not exists public.shared_state (     -- dropdown option lists etc.
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

-- ---------- helper functions -----------------------------------------
create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'admin')
$$;

-- ---------- new auth user -> profile ---------------------------------
-- The very first account ever created becomes the active admin.
-- Everyone else starts as an INACTIVE view-only user until an admin approves them.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare first_user boolean;
begin
  select not exists (select 1 from public.profiles) into first_user;
  insert into public.profiles (id, email, name, role, active, must_change)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    case when first_user then 'admin' else 'user' end,
    first_user,
    not first_user
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- accounts that already exist before this script was run
insert into public.profiles (id, email, name, role, active, must_change)
select u.id, u.email, split_part(u.email,'@',1),
       case when n.rn = 1 then 'admin' else 'user' end,
       (n.rn = 1), false
from (select id, row_number() over (order by created_at) rn from auth.users) n
join auth.users u on u.id = n.id
where not exists (select 1 from public.profiles p where p.id = u.id)
  and (select count(*) from public.profiles) = 0;

-- ---------- protect profiles ------------------------------------------
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if not public.is_admin() then
      if new.role <> old.role or new.active <> old.active
         or new.email <> old.email or new.id <> old.id then
        raise exception 'Only an admin can change role, status or email';
      end if;
    end if;
    if old.role = 'admin' and old.active and (new.role <> 'admin' or not new.active) then
      if not exists (select 1 from public.profiles
                     where role = 'admin' and active and id <> old.id) then
        raise exception 'There must be at least one active admin';
      end if;
    end if;
    return new;
  else
    if old.role = 'admin' and old.active then
      if not exists (select 1 from public.profiles
                     where role = 'admin' and active and id <> old.id) then
        raise exception 'There must be at least one active admin';
      end if;
    end if;
    return old;
  end if;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
  before update or delete on public.profiles
  for each row execute function public.protect_profile();

create or replace function public.touch_row() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before update on public.records
  for each row execute function public.touch_row();
drop trigger if exists shared_state_touch on public.shared_state;
create trigger shared_state_touch before update on public.shared_state
  for each row execute function public.touch_row();

-- ---------- row level security ----------------------------------------
alter table public.profiles     enable row level security;
alter table public.records      enable row level security;
alter table public.shared_state enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "records_select" on public.records;
drop policy if exists "records_insert" on public.records;
drop policy if exists "records_update" on public.records;
drop policy if exists "records_delete" on public.records;
create policy "records_select" on public.records for select to authenticated using (public.is_active());
create policy "records_insert" on public.records for insert to authenticated with check (public.is_admin());
create policy "records_update" on public.records for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "records_delete" on public.records for delete to authenticated using (public.is_admin());

drop policy if exists "state_select" on public.shared_state;
drop policy if exists "state_insert" on public.shared_state;
drop policy if exists "state_update" on public.shared_state;
drop policy if exists "state_delete" on public.shared_state;
create policy "state_select" on public.shared_state for select to authenticated using (public.is_active());
create policy "state_insert" on public.shared_state for insert to authenticated with check (public.is_admin());
create policy "state_update" on public.shared_state for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "state_delete" on public.shared_state for delete to authenticated using (public.is_admin());

-- ---------- admin-only account functions -------------------------------
create or replace function public.admin_update_profile(
  p_id uuid, p_name text default null, p_role text default null, p_active boolean default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only an admin can do this'; end if;
  if p_role is not null and p_role not in ('admin','user') then raise exception 'Invalid role'; end if;
  update public.profiles
     set name   = coalesce(p_name, name),
         role   = coalesce(p_role, role),
         active = coalesce(p_active, active)
   where id = p_id;
end $$;

create or replace function public.admin_set_password(p_id uuid, p_password text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if not public.is_admin() then raise exception 'Only an admin can do this'; end if;
  if length(coalesce(p_password,'')) < 6 then raise exception 'Password must be at least 6 characters'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_id;
  update public.profiles set must_change = (p_id <> auth.uid()) where id = p_id;
end $$;

create or replace function public.admin_delete_user(p_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Only an admin can do this'; end if;
  if p_id = auth.uid() then raise exception 'You cannot delete your own account'; end if;
  delete from auth.users where id = p_id;      -- profile row is removed by cascade
end $$;

revoke all on function public.admin_update_profile(uuid,text,text,boolean) from public, anon;
revoke all on function public.admin_set_password(uuid,text)               from public, anon;
revoke all on function public.admin_delete_user(uuid)                     from public, anon;
grant execute on function public.admin_update_profile(uuid,text,text,boolean) to authenticated;
grant execute on function public.admin_set_password(uuid,text)               to authenticated;
grant execute on function public.admin_delete_user(uuid)                     to authenticated;

-- ---------- live updates ------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.records;      exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.shared_state; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.profiles;     exception when duplicate_object then null; end;
end $$;
