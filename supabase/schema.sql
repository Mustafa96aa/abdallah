-- Supabase SQL Setup for Abdullah's Portfolio & Project Gallery
-- Run this script inside the Supabase SQL Editor (SQL Editor -> New Query)

-- 1. Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client text not null,
  category text not null check (category in ('photography', 'management', 'ads')),
  category_label text not null,
  timeframe text not null default '',
  metric_value text not null default '',
  metric_context text not null default '',
  summary text not null default '',
  created_at timestamptz not null default now()
);

-- 2. Project images table
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  storage_path text not null default '',
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_images_project_id
  on public.project_images(project_id, sort_order);

-- 3. Enable Row Level Security (RLS)
alter table public.projects enable row level security;
alter table public.project_images enable row level security;

-- Public read access for landing page visitors
create policy "Public can read projects"
  on public.projects for select
  using (true);

create policy "Public can read project images"
  on public.project_images for select
  using (true);

-- Authenticated admin access (Abdullah's account created in Supabase Auth)
create policy "Authenticated users can insert projects"
  on public.projects for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update projects"
  on public.projects for update
  to authenticated
  using (true);

create policy "Authenticated users can delete projects"
  on public.projects for delete
  to authenticated
  using (true);

create policy "Authenticated users can insert project images"
  on public.project_images for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete project images"
  on public.project_images for delete
  to authenticated
  using (true);

-- 4. Storage Bucket for Project Photos
insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do nothing;

create policy "Public can view project media"
  on storage.objects for select
  using (bucket_id = 'project-media');

create policy "Authenticated users can upload project media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-media');

create policy "Authenticated users can delete project media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-media');
