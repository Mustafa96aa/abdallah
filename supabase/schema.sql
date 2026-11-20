-- =====================================================================
--  إعداد قاعدة بيانات موقع عبد الله (نسخة آمنة)
--  يمكن تشغيله أكثر من مرة دون مشاكل.
--
--  طريقة التشغيل:  Supabase ← SQL Editor ← New query ← الصق الملف كله ← Run
--
--  مهم: غيّر الإيميل في دالة is_admin() أدناه إلى الإيميل الذي
--  تسجّل به الدخول إلى لوحة الإدارة في موقعك.
-- =====================================================================

-- 0) من هو المدير؟ (فقط هذا الحساب يستطيع التعديل والحذف والرفع)
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select lower(coalesce((select auth.jwt() ->> 'email'), '')) = lower('aboodee2004sh@gmail.com');
$$;

-- 1) جدول المشاريع
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

alter table public.projects drop constraint if exists projects_text_lengths;
alter table public.projects add constraint projects_text_lengths check (
  char_length(title) between 1 and 200
  and char_length(client) between 1 and 120
  and char_length(timeframe) <= 60
  and char_length(metric_value) <= 120
  and char_length(metric_context) <= 200
  and char_length(summary) <= 2000
);

-- 2) جدول صور المشاريع
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  storage_path text not null default '',
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.project_images drop constraint if exists project_images_text_lengths;
alter table public.project_images add constraint project_images_text_lengths check (
  char_length(url) <= 1000
  and char_length(storage_path) <= 500
  and char_length(caption) <= 200
);

create index if not exists idx_project_images_project_id
  on public.project_images(project_id, sort_order);

-- 3) جدول طلبات العملاء (فورم التواصل)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  contact text not null check (char_length(contact) between 5 and 120),
  company text check (char_length(company) <= 100),
  scope text not null check (char_length(scope) <= 120),
  budget text not null check (char_length(budget) <= 60),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

-- 4) تفعيل حماية الصفوف (RLS)
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.leads enable row level security;

-- 5) حذف السياسات القديمة (الأسماء القديمة والجديدة) ثم إعادة إنشائها
drop policy if exists "Public can read projects" on public.projects;
drop policy if exists "Authenticated users can insert projects" on public.projects;
drop policy if exists "Authenticated users can update projects" on public.projects;
drop policy if exists "Authenticated users can delete projects" on public.projects;
drop policy if exists "Anyone can read projects" on public.projects;
drop policy if exists "Admin can insert projects" on public.projects;
drop policy if exists "Admin can update projects" on public.projects;
drop policy if exists "Admin can delete projects" on public.projects;

drop policy if exists "Public can read project images" on public.project_images;
drop policy if exists "Authenticated users can insert project images" on public.project_images;
drop policy if exists "Authenticated users can delete project images" on public.project_images;
drop policy if exists "Anyone can read project images" on public.project_images;
drop policy if exists "Admin can insert project images" on public.project_images;
drop policy if exists "Admin can update project images" on public.project_images;
drop policy if exists "Admin can delete project images" on public.project_images;

drop policy if exists "Anyone can submit a lead" on public.leads;
drop policy if exists "Admin can read leads" on public.leads;
drop policy if exists "Admin can delete leads" on public.leads;

-- المشاريع: الجميع يقرأ، والمدير فقط يعدّل
create policy "Anyone can read projects"
  on public.projects for select
  using (true);

create policy "Admin can insert projects"
  on public.projects for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin can update projects"
  on public.projects for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can delete projects"
  on public.projects for delete
  to authenticated
  using (public.is_admin());

-- صور المشاريع: الجميع يقرأ، والمدير فقط يعدّل
create policy "Anyone can read project images"
  on public.project_images for select
  using (true);

create policy "Admin can insert project images"
  on public.project_images for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin can update project images"
  on public.project_images for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can delete project images"
  on public.project_images for delete
  to authenticated
  using (public.is_admin());

-- الطلبات: أي زائر يستطيع الإرسال فقط. القراءة والحذف للمدير فقط.
create policy "Anyone can submit a lead"
  on public.leads for insert
  to anon, authenticated
  with check (true);

create policy "Admin can read leads"
  on public.leads for select
  to authenticated
  using (public.is_admin());

create policy "Admin can delete leads"
  on public.leads for delete
  to authenticated
  using (public.is_admin());

-- 6) مخزن الصور: عام للعرض، بحد أقصى 5MB للصورة وأنواع صور فقط
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view project media" on storage.objects;
drop policy if exists "Authenticated users can upload project media" on storage.objects;
drop policy if exists "Authenticated users can delete project media" on storage.objects;
drop policy if exists "Admin can upload project media" on storage.objects;
drop policy if exists "Admin can list project media" on storage.objects;
drop policy if exists "Admin can delete project media" on storage.objects;

-- ملاحظة: عرض الصور للزوار لا يحتاج سياسة قراءة لأن المخزن عام.
-- حذفنا سياسة "Public can view" حتى لا يستطيع أحد سرد كل ملفات المخزن.
create policy "Admin can upload project media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-media' and public.is_admin());

create policy "Admin can list project media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-media' and public.is_admin());

create policy "Admin can delete project media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-media' and public.is_admin());
