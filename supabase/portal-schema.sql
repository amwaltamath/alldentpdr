create table if not exists public.vehicle_jobs (
  id text primary key,
  customer_name text not null,
  email text not null,
  phone text,
  year text not null,
  make text not null,
  model text not null,
  plate text not null,
  status text not null default 'Registered',
  notes text,
  notifications_enabled boolean not null default true,
  notification_channel text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicle_jobs_email_plate_idx
  on public.vehicle_jobs (email, plate);

create table if not exists public.portal_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.portal_admins (email)
values
  ('zachary@alldentpdr.com'),
  ('kevin@alldentpdr.com'),
  ('patrick@alldentpdr.com')
on conflict (email) do nothing;

alter table public.portal_admins enable row level security;

alter table public.vehicle_jobs enable row level security;

drop policy if exists "Allow authenticated read vehicle jobs" on public.vehicle_jobs;
drop policy if exists "Allow authenticated insert vehicle jobs" on public.vehicle_jobs;
drop policy if exists "Allow authenticated update vehicle jobs" on public.vehicle_jobs;

create or replace function public.is_portal_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portal_admins pa
    where pa.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_portal_admin() from public;
grant execute on function public.is_portal_admin() to authenticated;

create policy "Allow authenticated read vehicle jobs"
on public.vehicle_jobs
for select
to authenticated
using (public.is_portal_admin());

create policy "Allow authenticated insert vehicle jobs"
on public.vehicle_jobs
for insert
to authenticated
with check (public.is_portal_admin());

create policy "Allow authenticated update vehicle jobs"
on public.vehicle_jobs
for update
to authenticated
using (public.is_portal_admin())
with check (public.is_portal_admin());

create or replace function public.customer_lookup_vehicle(p_email text, p_plate text)
returns setof public.vehicle_jobs
language sql
security definer
set search_path = public
as $$
  select *
  from public.vehicle_jobs
  where email = lower(trim(p_email))
    and regexp_replace(upper(trim(plate)), '[^A-Z0-9]', '', 'g')
      = regexp_replace(upper(trim(p_plate)), '[^A-Z0-9]', '', 'g')
  order by updated_at desc
  limit 1;
$$;

revoke all on function public.customer_lookup_vehicle(text, text) from public;
grant execute on function public.customer_lookup_vehicle(text, text) to anon;
grant execute on function public.customer_lookup_vehicle(text, text) to authenticated;

create or replace function public.touch_vehicle_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicle_jobs_set_updated_at on public.vehicle_jobs;

create trigger vehicle_jobs_set_updated_at
before update on public.vehicle_jobs
for each row
execute procedure public.touch_vehicle_jobs_updated_at();
