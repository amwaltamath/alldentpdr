-- Migration: job notes thread on vehicle_jobs
-- Each note: { id, body, visibility ('internal'|'customer'), author, createdAt, notifiedAt }

alter table public.vehicle_jobs
  add column if not exists job_notes jsonb not null default '[]'::jsonb;

-- Customer lookup must not expose internal notes.
-- Uses plpgsql + SELECT * so column order always matches vehicle_jobs.
create or replace function public.customer_lookup_vehicle(p_email text, p_plate text)
returns setof public.vehicle_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.vehicle_jobs;
begin
  select *
  into r
  from public.vehicle_jobs v
  where v.email = lower(trim(p_email))
    and regexp_replace(upper(trim(v.plate)), '[^A-Z0-9]', '', 'g')
      = regexp_replace(upper(trim(p_plate)), '[^A-Z0-9]', '', 'g')
  order by v.updated_at desc
  limit 1;

  if r.id is null then
    return;
  end if;

  r.job_notes := coalesce(
    (
      select jsonb_agg(elem order by (elem->>'createdAt'))
      from jsonb_array_elements(coalesce(r.job_notes, '[]'::jsonb)) as elem
      where elem->>'visibility' = 'customer'
    ),
    '[]'::jsonb
  );

  return next r;
end;
$$;

revoke all on function public.customer_lookup_vehicle(text, text) from public;
grant execute on function public.customer_lookup_vehicle(text, text) to anon;
grant execute on function public.customer_lookup_vehicle(text, text) to authenticated;
