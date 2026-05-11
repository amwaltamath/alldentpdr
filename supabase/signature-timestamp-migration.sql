-- Add signed_at to vehicle_jobs to record the exact UTC timestamp
-- when the customer electronically signed the authorization agreements.
alter table public.vehicle_jobs
  add column if not exists signed_at timestamptz;

-- Update the public registration RPC to accept and store the signed_at timestamp.
-- Run AFTER registration-migration.sql is already applied.
create or replace function public.register_vehicle_public(
  p_customer_name           text,
  p_email                   text,
  p_phone                   text,
  p_year                    text,
  p_make                    text,
  p_model                   text,
  p_plate                   text,
  p_address                 text    default '',
  p_city                    text    default '',
  p_state                   text    default '',
  p_zip                     text    default '',
  p_home_phone              text    default '',
  p_how_heard               text    default '',
  p_vin                     text    default '',
  p_color                   text    default '',
  p_insurance_company       text    default '',
  p_deductible              text    default '',
  p_claim_number            text    default '',
  p_notes                   text    default '',
  p_direction_to_pay_signed boolean default false,
  p_repair_auth_signed      boolean default false,
  p_insurance_auth_name     text    default '',
  p_signature_name          text    default '',
  p_signed_at               timestamptz default now()
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id      text;
  v_attempt int := 0;
begin
  loop
    v_id := 'AD-' || upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.vehicle_jobs where id = v_id);
    v_attempt := v_attempt + 1;
    if v_attempt > 20 then
      raise exception 'Could not generate a unique job ID';
    end if;
  end loop;

  insert into public.vehicle_jobs (
    id, customer_name, email, phone,
    address, city, state, zip, home_phone, how_heard,
    year, make, model, plate, vin, color,
    insurance_company, deductible, claim_number,
    status, notes, notifications_enabled, notification_channel,
    direction_to_pay_signed, repair_auth_signed,
    insurance_auth_name, signature_name, signed_at
  ) values (
    v_id,
    p_customer_name, p_email, p_phone,
    p_address, p_city, p_state, p_zip, p_home_phone, p_how_heard,
    p_year, p_make, p_model, p_plate, p_vin, p_color,
    p_insurance_company, p_deductible, p_claim_number,
    'Estimate', p_notes, true, 'email',
    p_direction_to_pay_signed, p_repair_auth_signed,
    p_insurance_auth_name, p_signature_name,
    coalesce(p_signed_at, now())
  );

  return v_id;
end;
$$;
