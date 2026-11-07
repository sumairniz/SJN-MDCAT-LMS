-- SJN MedNest isolated Management Auth — sensitive action approval V1
-- DEDICATED STAFF AUTH project ONLY. NEVER execute in student staging/production.
-- 8-digit HMAC-protected email code: 10-minute validity; 30-minute authorized
-- window in the same live Auth session. Service-role-only RPCs; fail closed.
-- Each future sensitive mutation MUST call mednest_staff_sensitive_authorized
-- inside the same database transaction before changing anything.
create table public.mednest_staff_stepup (
 user_id uuid not null references public.mednest_staff_members(user_id) on delete restrict,
 session_id uuid not null,
 code_hash text check (code_hash is null or code_hash ~ '^[0-9a-f]{64}$'),
 sent_at timestamptz,
 code_expires_at timestamptz,
 verified_until timestamptz,
 attempt_count smallint not null default 0 check (attempt_count between 0 and 5),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key (user_id,session_id)
);
create index mednest_staff_stepup_session_expiration on public.mednest_staff_stepup(verified_until)
 where verified_until is not null;

create table public.mednest_staff_stepup_daily_quota (
 user_id uuid not null references public.mednest_staff_members(user_id) on delete restrict,
 bucket_date date not null,
 sent_count smallint not null default 0 check (sent_count between 0 and 5),
 primary key(user_id,bucket_date)
);
alter table public.mednest_staff_stepup enable row level security;
alter table public.mednest_staff_stepup_daily_quota enable row level security;
revoke all on public.mednest_staff_stepup, public.mednest_staff_stepup_daily_quota from public,anon,authenticated;
grant all on public.mednest_staff_stepup, public.mednest_staff_stepup_daily_quota to service_role;

-- This is an internal guard; it is NOT a public verification endpoint.
create or replace function public.mednest_staff_sensitive_authorized(
 p_user_id uuid, p_session_id uuid, p_action text
) returns boolean language sql security definer set search_path=pg_catalog
as $$
 select (
   p_action = any (array[
     'staff.invite','staff.permissions.update','staff.suspend',
     'staff.reactivate','staff.remove','staff.invite.revoke',
     'chief.email.change','students.records.delete','bulk.destructive.execute'
   ]::text[])
   and exists(
     select 1 from public.mednest_staff_members m
     join auth.users u on u.id=m.user_id
     join public.mednest_staff_stepup s on s.user_id=m.user_id
     where m.user_id=p_user_id and m.technical_role='chief_admin'
       and m.status='active'
       and m.email=lower(btrim(u.email))
       and u.email_confirmed_at is not null
       and s.session_id=p_session_id
       and s.verified_until > statement_timestamp()
       and public.mednest_staff_session_live(p_user_id,p_session_id)
   )
 );
$$;
revoke all on function public.mednest_staff_sensitive_authorized(uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.mednest_staff_sensitive_authorized(uuid,uuid,text)
 to service_role;

create or replace function public.mednest_staff_stepup_reserve(
 p_user_id uuid,p_session_id uuid,p_hash text
) returns text language plpgsql security definer set search_path=pg_catalog
as $$
declare
 v_today date;
 v_time timestamptz := statement_timestamp();
 v_previous record;
 v_sent smallint;
begin
 if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then return 'invalid'; end if;
 if not exists (
  select 1 from public.mednest_staff_members m
  join auth.users a on a.id=m.user_id
  where m.user_id=p_user_id and m.technical_role='chief_admin' and m.status='active'
   and m.email=lower(btrim(a.email)) and a.email_confirmed_at is not null
 ) or not public.mednest_staff_session_live(p_user_id,p_session_id)
   then return 'denied'; end if;
 -- Serializes requests across ALL of a Chief's sessions; prevents concurrent quota bypass.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,71291));
 select sent_at,verified_until into v_previous from public.mednest_staff_stepup
   where user_id=p_user_id and session_id=p_session_id for update;
 if v_previous.verified_until > v_time then return 'already_verified'; end if;
 if v_previous.sent_at is not null and v_previous.sent_at > v_time - interval '90 seconds'
   then return 'throttled'; end if;
 v_today := (v_time at time zone 'UTC')::date;
 select sent_count into v_sent from public.mednest_staff_stepup_daily_quota
  where user_id=p_user_id and bucket_date=v_today for update;
 if coalesce(v_sent,0)>=5 then return 'daily_limit'; end if;
 insert into public.mednest_staff_stepup_daily_quota(user_id,bucket_date,sent_count)
  values(p_user_id,v_today,1)
  on conflict(user_id,bucket_date) do update
   set sent_count=public.mednest_staff_stepup_daily_quota.sent_count+1;
 insert into public.mednest_staff_stepup
   (user_id,session_id,code_hash,sent_at,code_expires_at,verified_until,attempt_count,updated_at)
 values(p_user_id,p_session_id,p_hash,v_time,v_time+interval '10 minutes',null,0,v_time)
 on conflict(user_id,session_id) do update set
  code_hash=excluded.code_hash,sent_at=excluded.sent_at,
  code_expires_at=excluded.code_expires_at,
  verified_until=null,attempt_count=0,updated_at=excluded.updated_at;
 return 'reserved';
end;
$$;
revoke all on function public.mednest_staff_stepup_reserve(uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.mednest_staff_stepup_reserve(uuid,uuid,text) to service_role;

create or replace function public.mednest_staff_stepup_verify(
 p_user_id uuid,p_session_id uuid,p_hash text
) returns text language plpgsql security definer set search_path=pg_catalog
as $$
declare
 v_state public.mednest_staff_stepup%rowtype;
 v_time timestamptz := statement_timestamp();
begin
 if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then return 'invalid'; end if;
 if not exists(
  select 1 from public.mednest_staff_members m
   join auth.users u on u.id=m.user_id
   where m.user_id=p_user_id and m.technical_role='chief_admin'
    and m.status='active' and m.email=lower(btrim(u.email))
    and u.email_confirmed_at is not null
 ) or not public.mednest_staff_session_live(p_user_id,p_session_id)
   then return 'denied'; end if;
 select * into v_state from public.mednest_staff_stepup
  where user_id=p_user_id and session_id=p_session_id for update;
 if not found or v_state.code_hash is null
   or v_state.code_expires_at is null
   or v_state.code_expires_at<=v_time or v_state.attempt_count>=5
   then return 'expired'; end if;
 if v_state.code_hash <> p_hash then
  update public.mednest_staff_stepup
   set attempt_count=least(5,attempt_count+1),
       code_hash=case when attempt_count>=4 then null else code_hash end,
       updated_at=v_time
   where user_id=p_user_id and session_id=p_session_id;
  return 'invalid';
 end if;
 update public.mednest_staff_stepup
  set code_hash=null,code_expires_at=null,attempt_count=0,
      verified_until=v_time+interval '30 minutes',updated_at=v_time
  where user_id=p_user_id and session_id=p_session_id;
 insert into public.mednest_staff_audit(actor_user_id,action,target_user_id,details)
  values(p_user_id,'security.stepup_verified',p_user_id,
    '{"method":"session_email_code","valid_minutes":30}'::jsonb);
 return 'verified';
end;
$$;
revoke all on function public.mednest_staff_stepup_verify(uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.mednest_staff_stepup_verify(uuid,uuid,text) to service_role;
