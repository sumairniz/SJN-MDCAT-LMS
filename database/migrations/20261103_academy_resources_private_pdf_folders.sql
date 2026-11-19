-- Academy Resources staging-only foundation.
-- Does not alter MCQ, grading, attempts, history, or legacy resources.
create table if not exists public.academy_resource_folders (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.academy_resource_folders(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 120),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint academy_folder_not_self check (parent_id is null or id <> parent_id)
);
create index if not exists academy_folders_parent_order_idx
  on public.academy_resource_folders(parent_id, sort_order, name);

create table if not exists public.academy_resource_files (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.academy_resource_folders(id) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 200),
  description text not null default '',
  object_key text not null unique check (length(object_key) between 1 and 512),
  mime_type text not null default 'application/pdf'
    check (mime_type = 'application/pdf'),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists academy_files_folder_order_idx
  on public.academy_resource_files(folder_id, sort_order, title);

alter table public.academy_resource_folders enable row level security;
alter table public.academy_resource_files enable row level security;

-- Only published material is readable by authenticated students.
-- Writes remain service-role only until the Admin Panel has explicit RBAC.
create policy "academy_folders_student_read" on public.academy_resource_folders
  for select to authenticated using (is_published = true);
create policy "academy_files_student_read" on public.academy_resource_files
  for select to authenticated using (
    is_published = true and
    (folder_id is null or exists (
      select 1 from public.academy_resource_folders f
      where f.id = folder_id and f.is_published = true
    ))
  );

revoke all on public.academy_resource_folders, public.academy_resource_files from anon, authenticated;
grant select on public.academy_resource_folders, public.academy_resource_files to authenticated;
grant all on public.academy_resource_folders, public.academy_resource_files to service_role;
