-- Allow portal admins to delete spam leads from the admin dashboard
-- Run once in the Supabase SQL Editor (after leads-migration.sql)

drop policy if exists "Portal admins can delete leads" on public.leads;

create policy "Portal admins can delete leads"
on public.leads
for delete
to authenticated
using (public.is_portal_admin());
