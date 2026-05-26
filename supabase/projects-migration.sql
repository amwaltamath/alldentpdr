-- Projects gallery migration
-- Adds a `projects` table and a public `project-photos` storage bucket so
-- admins can publish before/after project showcases that appear on /projects.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  vehicle text,                -- e.g. "2022 Toyota Camry"
  category text,               -- e.g. "Hail Damage", "Door Ding"
  image_url text not null,     -- after / hero photo
  before_url text,             -- optional before photo
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_published_idx
  on public.projects (is_published, display_order desc, created_at desc);

-- RLS
alter table public.projects enable row level security;

drop policy if exists "Public read published projects" on public.projects;
drop policy if exists "Admin write projects"          on public.projects;
drop policy if exists "Admin update projects"         on public.projects;
drop policy if exists "Admin delete projects"         on public.projects;

create policy "Public read published projects"
on public.projects
for select
to anon, authenticated
using (is_published = true or public.is_portal_admin());

create policy "Admin write projects"
on public.projects
for insert
to authenticated
with check (public.is_portal_admin());

create policy "Admin update projects"
on public.projects
for update
to authenticated
using (public.is_portal_admin())
with check (public.is_portal_admin());

create policy "Admin delete projects"
on public.projects
for delete
to authenticated
using (public.is_portal_admin());

-- Storage bucket for project photos (public read, admin write).
insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read project photos"   on storage.objects;
drop policy if exists "Admin upload project photos"  on storage.objects;
drop policy if exists "Admin update project photos"  on storage.objects;
drop policy if exists "Admin delete project photos"  on storage.objects;

create policy "Public read project photos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'project-photos');

create policy "Admin upload project photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'project-photos' and public.is_portal_admin());

create policy "Admin update project photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'project-photos' and public.is_portal_admin())
with check (bucket_id = 'project-photos' and public.is_portal_admin());

create policy "Admin delete project photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'project-photos' and public.is_portal_admin());

-- Auto-update updated_at on row updates
create or replace function public.projects_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.projects_set_updated_at();
