-- Migration: normalize customer vehicle lookup to ignore plate formatting
-- Allows lookups to match regardless of spaces/dashes/case in plate values.

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
