-- Persist registration-time loaner agreement data into vehicle_jobs.release_form_data.
-- Run after registration-migration.sql, release-form-migration.sql, and signature-timestamp-migration.sql.

alter table public.vehicle_jobs
  add column if not exists release_form_data jsonb,
  add column if not exists signed_at timestamptz;

drop function if exists public.register_vehicle_public(
  text,text,text,text,text,text,text,text,text,
  text,text,text,text,text,text,text,text,text,text,
  boolean,boolean,text,text
);

drop function if exists public.register_vehicle_public(
  text,text,text,text,text,text,text,text,text,
  text,text,text,text,text,text,text,text,text,text,
  boolean,boolean,text,text,timestamptz
);

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
  p_requires_loaner         boolean default false,
  p_dl_number               text    default '',
  p_dl_state                text    default '',
  p_dl_expiration           text    default '',
  p_loaner_agreement_signed boolean default false,
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
  v_id text;
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
    insurance_auth_name, signature_name, signed_at, release_form_data
  ) values (
    v_id,
    trim(p_customer_name),
    lower(trim(p_email)),
    trim(coalesce(p_phone, '')),
    trim(coalesce(p_address, '')),
    trim(coalesce(p_city, '')),
    trim(coalesce(p_state, '')),
    trim(coalesce(p_zip, '')),
    trim(coalesce(p_home_phone, '')),
    trim(coalesce(p_how_heard, '')),
    trim(p_year),
    trim(p_make),
    trim(p_model),
    upper(trim(p_plate)),
    trim(coalesce(p_vin, '')),
    trim(coalesce(p_color, '')),
    trim(coalesce(p_insurance_company, '')),
    trim(coalesce(p_deductible, '')),
    trim(coalesce(p_claim_number, '')),
    'Estimate',
    trim(coalesce(p_notes, '')),
    true,
    'email',
    coalesce(p_direction_to_pay_signed, false),
    coalesce(p_repair_auth_signed, false),
    trim(coalesce(p_insurance_auth_name, '')),
    trim(coalesce(p_signature_name, '')),
    coalesce(p_signed_at, now()),
    case
      when coalesce(p_requires_loaner, false) then jsonb_build_object(
        'loanerAgreement',
        jsonb_strip_nulls(jsonb_build_object(
          'loanerProvided', true,
          'requestedAtRegistration', true,
          'termsAccepted', coalesce(p_loaner_agreement_signed, false),
          'signatureName', nullif(trim(coalesce(p_signature_name, '')), ''),
          'signedAt', coalesce(p_signed_at, now()),
          'dlNumber', nullif(trim(coalesce(p_dl_number, '')), ''),
          'dlState', nullif(trim(coalesce(p_dl_state, '')), ''),
          'dlExpiration', nullif(trim(coalesce(p_dl_expiration, '')), '')
        ))
      )
      else null
    end
  );

  return v_id;
end;
$$;

revoke all on function public.register_vehicle_public(
  text,text,text,text,text,text,text,text,text,
  text,text,text,text,text,text,text,text,text,text,
  boolean,text,text,text,boolean,boolean,boolean,text,text,timestamptz
) from public;

grant execute on function public.register_vehicle_public(
  text,text,text,text,text,text,text,text,text,
  text,text,text,text,text,text,text,text,text,text,
  boolean,text,text,text,boolean,boolean,boolean,text,text,timestamptz
) to anon;

grant execute on function public.register_vehicle_public(
  text,text,text,text,text,text,text,text,text,
  text,text,text,text,text,text,text,text,text,text,
  boolean,text,text,text,boolean,boolean,boolean,text,text,timestamptz
) to authenticated;