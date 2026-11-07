-- SJN MedNest Content Studio: isolated MANAGEMENT draft staging only.
-- Apply ONLY to independent staff Auth project tdqbjhrmfluiinntmjfh.
-- Never apply to student staging aozknkrwafowsrehdwlr or paused production.
-- A draft is NOT a published MCQ; no cross-project foreign keys or writes.
create table if not exists public.mednest_content_draft_batches (
 id uuid primary key default gen_random_uuid(),
 owner_user_id uuid not null references public.mednest_staff_members(user_id) on delete restrict,
 client_key uuid not null,
 title text not null check(length(btrim(title)) between 1 and 120),
 status text not null default 'draft' check(status in ('draft')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint mednest_content_batch_owner_key unique(owner_user_id,client_key)
);
create index if not exists mednest_content_batches_owner_recent
 on public.mednest_content_draft_batches(owner_user_id,created_at desc);

create table if not exists public.mednest_content_draft_rows (
 batch_id uuid not null references public.mednest_content_draft_batches(id) on delete restrict,
 position integer not null check(position between 1 and 3000),
 fields jsonb not null check(
   jsonb_typeof(fields)='object'
   and octet_length(fields::text)<=22000
 ),
 content_hash text not null check(content_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(batch_id,position)
);
create index if not exists mednest_content_rows_batch_position
 on public.mednest_content_draft_rows(batch_id,position);

-- Complete isolation from student Auth, students, mcqs and exam submissions.
-- No anon/authenticated read or write, including direct Data API access.
alter table public.mednest_content_draft_batches enable row level security;
alter table public.mednest_content_draft_rows enable row level security;
revoke all on table public.mednest_content_draft_batches,public.mednest_content_draft_rows from public,anon,authenticated;
grant select,insert,update on table public.mednest_content_draft_batches,public.mednest_content_draft_rows to service_role;

comment on table public.mednest_content_draft_batches is
 'Management-only unpublished academic drafts; server-verified Chief access. No student DB writes.';
comment on table public.mednest_content_draft_rows is
 'Management-only draft MCQ fields; immutable historical student attempt revisions stay in student project.';
