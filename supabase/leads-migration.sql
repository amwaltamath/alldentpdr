-- leads table: stores all contact form submissions with ad source attribution
create table if not exists public.leads (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  location text,
  vehicle text,
  message text not null,
  status text not null default 'New', -- New | Contacted | Quoted | Converted | Closed
  utm_source text,    -- e.g. google, facebook, instagram, organic
  utm_medium text,    -- e.g. cpc, paid, email, referral
  utm_campaign text,  -- campaign name from ad platform
  utm_content text,   -- ad set / creative ID
  utm_term text,      -- keyword (Google Ads)
  referrer text,      -- document.referrer at time of submission
  event_id text,      -- Meta/Google deduplication ID
  fbc text,           -- _fbc cookie for Meta CAPI
  fbp text,           -- _fbp cookie for Meta CAPI
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_utm_source_idx on public.leads (utm_source);

alter table public.leads enable row level security;

-- Anyone (including unauthenticated API routes) can INSERT a lead from the contact form
drop policy if exists "Anyone can insert leads" on public.leads;
create policy "Anyone can insert leads"
on public.leads
for insert
to anon, authenticated
with check (true);

-- Only portal admins can read leads
drop policy if exists "Portal admins can read leads" on public.leads;
create policy "Portal admins can read leads"
on public.leads
for select
to authenticated
using (public.is_portal_admin());

-- Only portal admins can update lead status
drop policy if exists "Portal admins can update leads" on public.leads;
create policy "Portal admins can update leads"
on public.leads
for update
to authenticated
using (public.is_portal_admin())
with check (public.is_portal_admin());
