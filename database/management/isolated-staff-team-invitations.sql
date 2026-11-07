-- SJN MedNest isolated staff team and invitation security (management Supabase only).
-- No student Auth, student records, student APIs or payment operations.
-- All protected table access and RPCs exclusively through service_role.
create table public.mednest_staff_invitations (
 id uuid primary key default gen_random_uuid(),
 email text not null check(email=lower(btrim(email)) and char_length(email) between 3 and 254),
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 display_name text check(char_length(display_name)<=100),
 organizational_title text check(char_length(organizational_title)<=100),
 permissions text[] not null default '{}'::text[],
 invited_by uuid not null references public.mednest_staff_members(user_id) on delete restrict,
 accepted_user_id uuid unique references auth.users(id) on delete restrict,
 state text not null default 'pending' check (state in ('pending','accepted','revoked','expired')),
 expires_at timestamptz not null default (now()+interval '72 hours'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index mednest_staff_one_pending_invitation_email on public.mednest_staff_invitations(email) where state='pending';
create index mednest_staff_invitations_created_at on public.mednest_staff_invitations(created_at desc);
create index mednest_staff_invitations_inviter on public.mednest_staff_invitations(invited_by);
create index mednest_staff_invitations_pending_expiration on public.mednest_staff_invitations(expires_at) where state='pending';
alter table public.mednest_staff_invitations enable row level security;
revoke all on public.mednest_staff_invitations from public,anon,authenticated;
grant all on public.mednest_staff_invitations to service_role;

-- "remove member" is an immediate irreversible staff-access revocation, not deletion of Auth.
alter table public.mednest_staff_members drop constraint if exists mednest_staff_members_status_check;
alter table public.mednest_staff_members add constraint mednest_staff_members_status_check
 check (status in ('active','suspended','revoked'));

create or replace function public.mednest_staff_permissions_valid(p_permissions text[])
returns boolean language sql immutable security invoker set search_path=pg_catalog
as $$
 select p_permissions is not null
 and coalesce(array_length(p_permissions,1),0) <= 26
 and not exists (
  select 1 from unnest(p_permissions) p
  where p is null or p <> all(array[
   'content.view','content.create','content.edit','content.import','content.review',
   'content.publish','content.archive','taxonomy.manage','pastpapers.manage',
   'courses.manage','courses.publish','resources.manage','students.view',
   'students.details','students.create','students.suspend','enrollments.grant',
   'enrollments.revoke','access.change','reports.view','reports.resolve',
   'analytics.view','audit.view','finance.verify','announcements.manage'
  ]::text[])
 )
 and coalesce(array_length(p_permissions,1),0)=(select count(distinct val) from unnest(p_permissions) val);
$$;
revoke all on function public.mednest_staff_permissions_valid(text[]) from public,anon,authenticated;
grant execute on function public.mednest_staff_permissions_valid(text[]) to service_role;

create or replace function public.mednest_staff_create_invitation(
 p_actor uuid,p_session uuid,p_email text,p_hash text,
 p_name text,p_title text,p_permissions text[]
) returns uuid language plpgsql security definer set search_path=pg_catalog
as $$
declare
 v_id uuid;
 v_email text := lower(btrim(p_email));
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text,84511));
 if not public.mednest_staff_sensitive_authorized(p_actor,p_session,'staff.invite') then
  raise exception 'staff_stepup_required' using errcode='P0001'; end if;
 if p_hash !~ '^[0-9a-f]{64}$' or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  or char_length(v_email)>254 or char_length(coalesce(p_name,''))>100
  or char_length(coalesce(p_title,''))>100
  or not public.mednest_staff_permissions_valid(p_permissions)
  then raise exception 'invalid_invitation' using errcode='P0001'; end if;
 if exists(select 1 from public.mednest_staff_members m where m.email=v_email)
  then raise exception 'existing_staff_account' using errcode='P0001'; end if;
 update public.mednest_staff_invitations set state='expired',updated_at=now()
  where state='pending' and expires_at<=statement_timestamp();
 if (select count(*) from public.mednest_staff_invitations where state='pending')>=100
  then raise exception 'pending_invitation_limit' using errcode='P0001'; end if;
 insert into public.mednest_staff_invitations(
  email,token_hash,display_name,organizational_title,permissions,invited_by)
 values(v_email,p_hash,nullif(btrim(p_name),''),nullif(btrim(p_title),''),p_permissions,p_actor)
 returning id into v_id;
 insert into public.mednest_staff_audit(actor_user_id,action,details)
 values(p_actor,'staff.invite','{"action":"staff.invite","delivery":"pending"}'::jsonb);
 return v_id;
end;
$$;
revoke all on function public.mednest_staff_create_invitation(uuid,uuid,text,text,text,text,text[]) from public,anon,authenticated;
grant execute on function public.mednest_staff_create_invitation(uuid,uuid,text,text,text,text,text[]) to service_role;

create or replace function public.mednest_staff_revoke_invitation(
 p_actor uuid,p_session uuid,p_invitation uuid
) returns boolean language plpgsql security definer set search_path=pg_catalog
as $$
begin
 if not public.mednest_staff_sensitive_authorized(p_actor,p_session,'staff.invite.revoke')
  then return false; end if;
 update public.mednest_staff_invitations set state='revoked',updated_at=now()
  where id=p_invitation and state='pending';
 if not found then return false; end if;
 insert into public.mednest_staff_audit(actor_user_id,action,details)
  values(p_actor,'staff.invite.revoke','{}'::jsonb);
 return true;
end;
$$;
revoke all on function public.mednest_staff_revoke_invitation(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.mednest_staff_revoke_invitation(uuid,uuid,uuid) to service_role;

create or replace function public.mednest_staff_accept_invitation(
 p_user uuid,p_hash text
) returns text language plpgsql security definer set search_path=pg_catalog
as $$
declare v_inv public.mednest_staff_invitations%rowtype;v_email text;v_confirm timestamptz;
begin
 if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then return 'denied'; end if;
 select * into v_inv from public.mednest_staff_invitations
   where token_hash=p_hash for update;
 if not found or v_inv.state<>'pending'
  or v_inv.expires_at<=statement_timestamp() then return 'expired'; end if;
 select lower(btrim(u.email)),u.email_confirmed_at into v_email,v_confirm
   from auth.users u where u.id=p_user;
 if v_confirm is null or v_email is distinct from v_inv.email then return 'denied'; end if;
 if exists(select 1 from public.mednest_staff_members where user_id=p_user or email=v_email)
   then return 'denied'; end if;
 insert into public.mednest_staff_members(
  user_id,email,technical_role,status,permissions,display_name,organizational_title)
 values(p_user,v_email,'member','active',v_inv.permissions,v_inv.display_name,v_inv.organizational_title);
 update public.mednest_staff_invitations set
  state='accepted',accepted_user_id=p_user,updated_at=now() where id=v_inv.id;
 insert into public.mednest_staff_audit(actor_user_id,action,target_user_id,details)
 values(p_user,'staff.invite.accept',p_user,'{}'::jsonb);
 return 'accepted';
end;
$$;
revoke all on function public.mednest_staff_accept_invitation(uuid,text) from public,anon,authenticated;
grant execute on function public.mednest_staff_accept_invitation(uuid,text) to service_role;

create or replace function public.mednest_staff_change_member(
 p_actor uuid,p_session uuid,p_target uuid,p_new_status text,
 p_name text,p_title text,p_permissions text[]
) returns text language plpgsql security definer set search_path=pg_catalog
as $$
declare v_before public.mednest_staff_members%rowtype;v_action text;
begin
 select * into v_before from public.mednest_staff_members
 where user_id=p_target and technical_role='member' for update;
 if not found or v_before.status='revoked' then return 'not_found'; end if;
 if p_new_status not in ('active','suspended','revoked')
  or not public.mednest_staff_permissions_valid(p_permissions)
  or char_length(coalesce(p_name,''))>100 or char_length(coalesce(p_title,''))>100
 then return 'invalid'; end if;
 v_action := case
  when p_new_status='revoked' then 'staff.remove'
  when p_new_status='suspended' and v_before.status<>'suspended' then 'staff.suspend'
  when p_new_status='active' and v_before.status='suspended' then 'staff.reactivate'
  else 'staff.permissions.update' end;
 if not public.mednest_staff_sensitive_authorized(p_actor,p_session,v_action)
  then return 'stepup_required'; end if;
 update public.mednest_staff_members
 set status=p_new_status,permissions=case when p_new_status='revoked' then '{}'::text[] else p_permissions end,
 display_name=nullif(btrim(p_name),''),organizational_title=nullif(btrim(p_title),''),
 updated_at=now()
 where user_id=p_target and technical_role='member';
 insert into public.mednest_staff_audit(actor_user_id,action,target_user_id,details)
 values(p_actor,v_action,p_target,'{"fields":["status","permissions","display_name","organizational_title"]}'::jsonb);
 return 'updated';
end;
$$;
revoke all on function public.mednest_staff_change_member(uuid,uuid,uuid,text,text,text,text[]) from public,anon,authenticated;
grant execute on function public.mednest_staff_change_member(uuid,uuid,uuid,text,text,text,text[]) to service_role;
