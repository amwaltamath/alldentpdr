-- Multi-photo gallery support for Our Work projects
-- Run after projects-migration.sql

-- Allow projects without legacy single image_url (photos live in project_images)
alter table public.projects alter column image_url drop not null;

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_images_project_idx
  on public.project_images (project_id, display_order asc, created_at asc);

alter table public.project_images enable row level security;

drop policy if exists "Public read project images" on public.project_images;
drop policy if exists "Admin insert project images" on public.project_images;
drop policy if exists "Admin update project images" on public.project_images;
drop policy if exists "Admin delete project images" on public.project_images;

create policy "Public read project images"
on public.project_images
for select
to anon, authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and (p.is_published = true or public.is_portal_admin())
  )
);

create policy "Admin insert project images"
on public.project_images
for insert
to authenticated
with check (public.is_portal_admin());

create policy "Admin update project images"
on public.project_images
for update
to authenticated
using (public.is_portal_admin())
with check (public.is_portal_admin());

create policy "Admin delete project images"
on public.project_images
for delete
to authenticated
using (public.is_portal_admin());
