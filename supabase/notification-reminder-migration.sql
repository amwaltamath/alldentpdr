-- Add last_notified_at to vehicle_jobs so the 48-hour reminder cron
-- knows when the customer was last emailed about their status.
alter table public.vehicle_jobs
  add column if not exists last_notified_at timestamptz;
