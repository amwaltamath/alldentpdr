-- Migration: job notes thread on vehicle_jobs
-- Each note: { id, body, visibility ('internal'|'customer'), author, createdAt, notifiedAt }

alter table public.vehicle_jobs
  add column if not exists job_notes jsonb not null default '[]'::jsonb;

-- Customer lookup must not expose internal notes
create or replace function public.customer_lookup_vehicle(p_email text, p_plate text)
returns setof public.vehicle_jobs
language sql
security definer
set search_path = public
as $$
  select
    v.id,
    v.customer_name,
    v.email,
    v.phone,
    v.year,
    v.make,
    v.model,
    v.plate,
    v.status,
    v.notes,
    v.notifications_enabled,
    v.notification_channel,
    v.created_at,
    v.updated_at,
    v.address,
    v.city,
    v.state,
    v.zip,
    v.home_phone,
    v.how_heard,
    v.vin,
    v.color,
    v.insurance_company,
    v.deductible,
    v.claim_number,
    v.direction_to_pay_signed,
    v.repair_auth_signed,
    v.insurance_auth_name,
    v.signature_name,
    v.signed_at,
    v.release_form_data,
    v.last_notified_at,
    coalesce(
      (
        select jsonb_agg(elem order by (elem->>'createdAt'))
        from jsonb_array_elements(coalesce(v.job_notes, '[]'::jsonb)) as elem
        where elem->>'visibility' = 'customer'
      ),
      '[]'::jsonb
    ) as job_notes
  from public.vehicle_jobs v
  where v.email = lower(trim(p_email))
    and regexp_replace(upper(trim(v.plate)), '[^A-Z0-9]', '', 'g')
      = regexp_replace(upper(trim(p_plate)), '[^A-Z0-9]', '', 'g')
  order by v.updated_at desc
  limit 1;
$$;

revoke all on function public.customer_lookup_vehicle(text, text) from public;
grant execute on function public.customer_lookup_vehicle(text, text) to anon;
grant execute on function public.customer_lookup_vehicle(text, text) to authenticated;
