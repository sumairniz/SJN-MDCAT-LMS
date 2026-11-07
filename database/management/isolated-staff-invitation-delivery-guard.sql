-- SJN MedNest: fail-closed invitation delivery, quotas and identity-specific acceptance.
-- Management Auth ONLY. NEVER apply to student LMS Supabase.
alter table public.mednest_staff_invitations
 add column if not exists delivery_status text not null default 'queued'
 check (delivery_status in ('queued','sent','failed'));
alter table public.mednest_staff_invitations
 add column if not exists delivery_marked_at timestamptz;
-- Fail closed on any previously pending invitation without proven email delivery.
update public.mednest_staff_invitations
 set state='revoked',delivery_status='failed',delivery_marked_at=now(),updated_at=now()
 where state='pending' and delivery_status<>'sent';
create index if not exists mednest_staff_invitations_delivered_active
 on public.mednest_staff_invitations(email,expires_at)
 where state='pending' and delivery_status='sent';
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
 if (select count(*) from public.mednest_staff_invitations
     where invited_by=p_actor
       and created_at >= (date_trunc('day',statement_timestamp() at time zone 'UTC') at time zone 'UTC'))>=10
  then raise exception 'daily_invitation_limit' using errcode='P0001'; end if;
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

create or replace function public.mednest_staff_accept_invitation(
 p_user uuid,p_hash text
) returns text language plpgsql security definer set search_path=pg_catalog
as $$
declare v_inv public.mednest_staff_invitations%rowtype;v_email text;v_confirm timestamptz;
begin
 if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then return 'denied'; end if;
 select * into v_inv from public.mednest_staff_invitations
   where token_hash=p_hash for update;
 if not found or v_inv.state<>'pending' or v_inv.delivery_status<>'sent'
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

create or replace function public.mednest_staff_finalize_invitation_delivery(
 p_actor uuid,p_session uuid,p_invitation uuid,p_delivered boolean
) returns text language plpgsql security definer set search_path=pg_catalog
as $$
declare v_inv public.mednest_staff_invitations%rowtype;
begin
 select * into v_inv from public.mednest_staff_invitations
  where id=p_invitation and invited_by=p_actor for update;
 if not found or v_inv.state<>'pending' or v_inv.delivery_status<>'queued'
  then return 'not_pending'; end if;
 if p_delivered is not true
    or not public.mednest_staff_sensitive_authorized(p_actor,p_session,'staff.invite')
    or v_inv.expires_at<=statement_timestamp()
 then
  update public.mednest_staff_invitations
   set delivery_status='failed',state='revoked',
     delivery_marked_at=statement_timestamp(),updated_at=statement_timestamp()
   where id=p_invitation;
  insert into public.mednest_staff_audit(actor_user_id,action,details)
   values(p_actor,'staff.invite.delivery_failed','{"delivery":"failed_or_authorization_expired"}'::jsonb);
  return 'blocked';
 end if;
 update public.mednest_staff_invitations
  set delivery_status='sent',delivery_marked_at=statement_timestamp(),updated_at=statement_timestamp()
  where id=p_invitation and state='pending' and delivery_status='queued';
 insert into public.mednest_staff_audit(actor_user_id,action,details)
  values(p_actor,'staff.invite.sent','{"delivery":"confirmed_by_provider"}'::jsonb);
 return 'sent';
end;
$$;
revoke all on function public.mednest_staff_finalize_invitation_delivery(uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.mednest_staff_finalize_invitation_delivery(uuid,uuid,uuid,boolean) to service_role;
