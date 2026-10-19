-- Vendor portal: local shops that can receive leads All Dent does not want to repair.
-- Run in the Supabase SQL editor, then create a Supabase Auth user for each vendor email.

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text not null unique,
  phone text,
  city text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists vendors_email_idx on public.vendors (lower(email));

alter table public.leads
  add column if not exists assigned_vendor_id uuid references public.vendors(id) on delete set null,
  add column if not exists assignment_status text,
  add column if not exists assignment_note text,
  add column if not exists vendor_response_note text,
  add column if not exists assigned_at timestamptz;

create index if not exists leads_assigned_vendor_idx on public.leads (assigned_vendor_id);

alter table public.vendors enable row level security;

create or replace function public.current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select v.id
  from public.vendors v
  where lower(v.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and v.active = true
  limit 1;
$$;

create or replace function public.is_portal_vendor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_vendor_id() is not null;
$$;

revoke all on function public.current_vendor_id() from public;
revoke all on function public.is_portal_vendor() from public;
grant execute on function public.current_vendor_id() to authenticated;
grant execute on function public.is_portal_vendor() to authenticated;

drop policy if exists "Portal admins manage vendors" on public.vendors;
create policy "Portal admins manage vendors"
on public.vendors
for all
to authenticated
using (public.is_portal_admin())
with check (public.is_portal_admin());

drop policy if exists "Vendors can read own profile" on public.vendors;
create policy "Vendors can read own profile"
on public.vendors
for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Vendors can read assigned leads" on public.leads;
create policy "Vendors can read assigned leads"
on public.leads
for select
to authenticated
using (
  assigned_vendor_id is not null
  and assigned_vendor_id = public.current_vendor_id()
);

-- Vendors update assignment through this function so they cannot edit contact data or ad fields.
create or replace function public.vendor_respond_to_lead(
  p_lead_id text,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor uuid := public.current_vendor_id();
begin
  if v_vendor is null then
    raise exception 'Not a vendor';
  end if;

  if p_status not in ('accepted', 'declined', 'completed') then
    raise exception 'Invalid status';
  end if;

  update public.leads
  set
    assignment_status = p_status,
    vendor_response_note = nullif(trim(coalesce(p_note, '')), ''),
    status = case when p_status = 'completed' then 'Closed' else 'Referred' end,
    updated_at = now()
  where id = p_lead_id
    and assigned_vendor_id = v_vendor;

  if not found then
    raise exception 'Lead is not assigned to you';
  end if;
end;
$$;

revoke all on function public.vendor_respond_to_lead(text, text, text) from public;
grant execute on function public.vendor_respond_to_lead(text, text, text) to authenticated;

create or replace view public.vendor_assigned_leads
with (security_invoker = true) as
select
  id,
  name,
  email,
  phone,
  location,
  vehicle,
  message,
  assignment_status,
  assignment_note,
  vendor_response_note,
  assigned_at,
  created_at
from public.leads
where assigned_vendor_id is not null;

grant select on public.vendor_assigned_leads to authenticated;
grant select, insert, update, delete on public.vendors to authenticated;
