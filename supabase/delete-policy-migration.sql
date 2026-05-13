-- Migration: add DELETE policy for portal admins on vehicle_jobs
-- Run this once in the Supabase SQL Editor

create policy "Allow authenticated delete vehicle jobs"
on public.vehicle_jobs
for delete
to authenticated
using (public.is_portal_admin());
