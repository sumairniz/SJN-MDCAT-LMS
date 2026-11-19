-- Staging management schema reference only; already applied to staging on 2026-11-06.
-- No staff accounts are seeded by this migration.
create table if not exists public.mednest_management_members (
 user_id uuid primary key references auth.users(id) on delete restrict,
 email text not null check(email=lower(email) and length(email) between 3 and 254),
 technical_role text not null check(technical_role in ('chief_admin','member')),
 status text not null default 'invited' check(status in ('invited','active','suspended')),
 permissions text[] not null default array[]::text[],
 display_name text null check(display_name is null or length(display_name) between 1 and 100),
 organizational_title text null check(organizational_title is null or length(organizational_title) between 1 and 100),
 invited_by uuid null references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists mednest_members_one_chief on public.mednest_management_members(technical_role) where technical_role='chief_admin';
create index if not exists mednest_members_status on public.mednest_management_members(status,created_at desc);
create table if not exists public.mednest_management_audit (
 id bigint generated always as identity primary key,
 actor_user_id uuid not null references auth.users(id) on delete restrict,
 action text not null check(length(action) between 3 and 96),
 target_user_id uuid null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists mednest_audit_created on public.mednest_management_audit(created_at desc);
create index if not exists mednest_audit_actor_created on public.mednest_management_audit(actor_user_id,created_at desc);
alter table public.mednest_management_members enable row level security;
alter table public.mednest_management_audit enable row level security;
revoke all on public.mednest_management_members from anon, authenticated;
revoke all on public.mednest_management_audit from anon, authenticated;
revoke all on sequence public.mednest_management_audit_id_seq from anon, authenticated;
grant select,insert,update on public.mednest_management_members to service_role;
grant select,insert on public.mednest_management_audit to service_role;
grant usage on sequence public.mednest_management_audit_id_seq to service_role;
