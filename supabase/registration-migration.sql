-- ============================================================
-- Registration Migration — add extended fields to vehicle_jobs
-- Run this in Supabase SQL Editor after portal-schema.sql
-- ============================================================

alter table public.vehicle_jobs
  add column if not exists address             text,
  add column if not exists city                text,
  add column if not exists state               text,
  add column if not exists zip                 text,
  add column if not exists home_phone          text,
  add column if not exists how_heard           text,
  add column if not exists vin                 text,
  add column if not exists color               text,
  add column if not exists insurance_company   text,
  add column if not exists deductible          text,
  add column if not exists claim_number        text,
  add column if not exists direction_to_pay_signed boolean not null default false,
  add column if not exists repair_auth_signed       boolean not null default false,
  add column if not exists insurance_auth_name text,
  add column if not exists signature_name      text;

-- ============================================================
-- Public registration RPC
-- security definer so anonymous visitors can INSERT via this fn
-- ============================================================

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
  p_signature_name          text    default ''
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
    insurance_auth_name, signature_name
  ) values (
    v_id,
    trim(p_customer_name),
    lower(trim(p_email)),
    trim(coalesce(p_phone,             '')),
    trim(coalesce(p_address,           '')),
    trim(coalesce(p_city,              '')),
    trim(coalesce(p_state,             '')),
    trim(coalesce(p_zip,               '')),
    trim(coalesce(p_home_phone,        '')),
    trim(coalesce(p_how_heard,         '')),
    trim(p_year),
    trim(p_make),
    trim(p_model),
    upper(trim(p_plate)),
    trim(coalesce(p_vin,               '')),
    trim(coalesce(p_color,             '')),
    trim(coalesce(p_insurance_company, '')),
    trim(coalesce(p_deductible,        '')),
    trim(coalesce(p_claim_number,      '')),
    'Registered',
    trim(coalesce(p_notes,             '')),
    true,
    'email',
    coalesce(p_direction_to_pay_signed, false),
    coalesce(p_repair_auth_signed,      false),
    trim(coalesce(p_insurance_auth_name, '')),
    trim(coalesce(p_signature_name,      ''))
  );

  return v_id;
end;
$$;

revoke all on function public.register_vehicle_public(
  text,text,text,text,text,text,text,text,text,
  text,text,text,text,text,text,text,text,text,text,
  boolean,boolean,text,text
) from public;

grant execute on function public.register_vehicle_public(
  text,text,text,text,text,text,text,text,text,
  text,text,text,text,text,text,text,text,text,text,
  boolean,boolean,text,text
) to anon;

grant execute on function public.register_vehicle_public(
  text,text,text,text,text,text,text,text,text,
  text,text,text,text,text,text,text,text,text,text,
  boolean,boolean,text,text
) to authenticated;
