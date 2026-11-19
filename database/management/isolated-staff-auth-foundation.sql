-- SJN MedNest Academy: completely isolated staff-auth foundation
-- Run ONLY on dedicated staff Supabase project tdqbjhrmfluiinntmjfh.
-- Never apply to student staging, student production or old paused Supabase project.
-- Chief bootstrap approval is seeded privately after migration, not in GitHub source.
create table public.mednest_staff_members (
  user_id uuid primary key references auth.users(id) on delete restrict,
  email text not null check (email = lower(btrim(email))),
  technical_role text not null check (technical_role in ('chief_admin','member')),
  status text not null default 'active' check (status in ('active','suspended')),
  permissions text[] not null default '{}'::text[],
  display_name text check (char_length(display_name)<=100),
  organizational_title text check (char_length(organizational_title)<=100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index mednest_staff_one_chief on public.mednest_staff_members (technical_role)
  where technical_role='chief_admin';

create table public.mednest_staff_bootstrap (
  id smallint primary key default 1 check (id=1),
  email_sha256 text not null check (email_sha256 ~ '^[0-9a-f]{64}$'),
  claimed_user_id uuid unique references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

create table public.mednest_staff_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_user_id uuid references auth.users(id) on delete restrict,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index mednest_staff_audit_created on public.mednest_staff_audit (created_at desc);

-- No client grants or RLS policies: only trusted service-role API can access data.
alter table public.mednest_staff_members enable row level security;
alter table public.mednest_staff_bootstrap enable row level security;
alter table public.mednest_staff_audit enable row level security;
revoke all on table public.mednest_staff_members,public.mednest_staff_bootstrap,public.mednest_staff_audit from public,anon,authenticated;
grant all on table public.mednest_staff_members,public.mednest_staff_bootstrap,public.mednest_staff_audit to service_role;
revoke all on sequence public.mednest_staff_audit_id_seq from public,anon,authenticated;
grant usage, select on sequence public.mednest_staff_audit_id_seq to service_role;

-- Check an actual *management-project* Auth session is still valid.
create or replace function public.mednest_staff_session_live(p_user_id uuid,p_session_id uuid)
returns boolean language sql security definer set search_path=pg_catalog
as $$
  select exists (
    select 1 from auth.sessions s
    where s.id=p_session_id and s.user_id=p_user_id
      and (s.not_after is null or s.not_after>now())
  );
$$;
revoke all on function public.mednest_staff_session_live(uuid,uuid) from public,anon,authenticated;
grant execute on function public.mednest_staff_session_live(uuid,uuid) to service_role;

-- Chief may be claimed only by the ONE existing Chief's previously verified email,
-- with a *newly email-confirmed* independent Auth identity.
-- Function is service-role-only; server revalidates JWT, Auth user and live session.
create or replace function public.mednest_staff_claim_chief(p_user_id uuid)
returns text language plpgsql security definer set search_path=pg_catalog
as $$
declare
  v_email text;
  v_confirmed_at timestamptz;
  v_approved_hash text;
  v_existing_role text;
begin
  perform pg_advisory_xact_lock(hashtext('sjn-mednest-isolated-chief-bootstrap-v1'));
  select technical_role into v_existing_role
    from public.mednest_staff_members where user_id=p_user_id;
  if v_existing_role='chief_admin' then return 'already_active'; end if;
  if v_existing_role is not null then return 'not_approved'; end if;
  if exists (select 1 from public.mednest_staff_members where technical_role='chief_admin')
    then return 'not_approved'; end if;
  select u.email,u.email_confirmed_at into v_email,v_confirmed_at
    from auth.users u where u.id=p_user_id;
  if v_email is null or v_confirmed_at is null then return 'email_unverified'; end if;
  select email_sha256 into v_approved_hash from public.mednest_staff_bootstrap
    where id=1 and claimed_user_id is null for update;
  if v_approved_hash is null
     or encode(extensions.digest(lower(btrim(v_email)),'sha256'),'hex')<>v_approved_hash
    then return 'not_approved'; end if;
  insert into public.mednest_staff_members(user_id,email,technical_role)
    values (p_user_id,lower(btrim(v_email)),'chief_admin');
  update public.mednest_staff_bootstrap set claimed_user_id=p_user_id,claimed_at=now()
    where id=1;
  insert into public.mednest_staff_audit(actor_user_id,action,target_user_id,details)
    values(p_user_id,'chief.bootstrap',p_user_id,
      '{"method":"new_project_verified_email_allowlist"}'::jsonb);
  return 'activated';
end;
$$;
revoke all on function public.mednest_staff_claim_chief(uuid) from public,anon,authenticated;
grant execute on function public.mednest_staff_claim_chief(uuid) to service_role;

-- Server-verified self-profile edits; never modify role, email, permissions or status.
create or replace function public.mednest_staff_update_chief_profile(
  p_user_id uuid,p_display_name text,p_organizational_title text
) returns text language plpgsql security definer set search_path=pg_catalog
as $$
declare v_status text;
begin
 if p_display_name is not null and char_length(btrim(p_display_name))>100 then return 'invalid'; end if;
 if p_organizational_title is not null and char_length(btrim(p_organizational_title))>100 then return 'invalid'; end if;
 select status into v_status from public.mednest_staff_members
  where user_id=p_user_id and technical_role='chief_admin' for update;
 if v_status is distinct from 'active' then return 'denied'; end if;
 update public.mednest_staff_members set
  display_name=nullif(btrim(p_display_name),''),
  organizational_title=nullif(btrim(p_organizational_title),''),
  updated_at=now()
 where user_id=p_user_id;
 insert into public.mednest_staff_audit(actor_user_id,action,target_user_id,details)
  values (p_user_id,'chief.profile_updated',p_user_id,
   '{"fields":["display_name","organizational_title"]}'::jsonb);
 return 'updated';
end;
$$;
revoke all on function public.mednest_staff_update_chief_profile(uuid,text,text) from public,anon,authenticated;
grant execute on function public.mednest_staff_update_chief_profile(uuid,text,text) to service_role;

-- Invitation, staff mutation, cross-project student operation and email step-up
-- endpoints are intentionally NOT available in this foundation.
