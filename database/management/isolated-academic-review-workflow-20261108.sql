-- SJN MedNest Academic Review workflow: management Auth ONLY.
-- The student LMS database and immutable MCQ revisions are never mutated here.
create table if not exists public.mednest_academic_review_policies (
 scope text primary key check (scope in ('mcq_correction')),
 review_mode text not null default 'one' check (review_mode in ('direct','one','two')),
 version integer not null default 1 check (version>0),
 updated_by uuid references public.mednest_staff_members(user_id) on delete restrict,
 updated_at timestamptz not null default now()
);
insert into public.mednest_academic_review_policies(scope,review_mode)
 values('mcq_correction','one') on conflict(scope) do nothing;

create table if not exists public.mednest_academic_review_submissions (
 id uuid primary key default gen_random_uuid(),
 draft_id uuid not null references public.mednest_mcq_edit_drafts(id) on delete restrict,
 author_user_id uuid not null references public.mednest_staff_members(user_id) on delete restrict,
 source_mcq_id bigint not null check(source_mcq_id>0),
 source_bank text not null,
 source_revision_id bigint not null check(source_revision_id>0),
 submitted_draft_version integer not null check(submitted_draft_version>0),
 submitted_fields jsonb not null check(jsonb_typeof(submitted_fields)='object' and octet_length(submitted_fields::text)<=50000),
 syllabus_topic_id uuid references public.mednest_syllabus_nodes(id) on delete restrict,
 policy_mode text not null check(policy_mode in ('direct','one','two')),
 required_reviewers integer not null check(required_reviewers between 0 and 2),
 state text not null default 'pending' check(state in ('pending','needs_changes','approved_for_release','withdrawn')),
 review_1_user_id uuid references public.mednest_staff_members(user_id) on delete restrict,
 review_2_user_id uuid references public.mednest_staff_members(user_id) on delete restrict,
 rejection_reason text check(char_length(rejection_reason)<=1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint mednest_review_distinct_reviewers check (
  (review_1_user_id is null or review_1_user_id<>author_user_id) and
  (review_2_user_id is null or (review_2_user_id<>author_user_id and review_2_user_id<>review_1_user_id))
 )
);
create unique index if not exists mednest_review_one_active_submission
 on public.mednest_academic_review_submissions(draft_id)
 where state in ('pending','approved_for_release');
create index if not exists mednest_review_queue_order
 on public.mednest_academic_review_submissions(state,created_at desc);

alter table public.mednest_academic_review_policies enable row level security;
alter table public.mednest_academic_review_submissions enable row level security;
revoke all on table public.mednest_academic_review_policies,public.mednest_academic_review_submissions
 from public,anon,authenticated;
grant select,insert,update on table public.mednest_academic_review_policies,public.mednest_academic_review_submissions
 to service_role;

-- Policy changes require an active Chief session PLUS already-tested 30-minute
-- sensitive-action email step-up, equivalent to changes in staff permissions.
create or replace function public.mednest_academic_review_set_policy(
 p_actor uuid,p_session uuid,p_mode text,p_expected_version integer
) returns jsonb language plpgsql security invoker set search_path=pg_catalog
as $$
declare v_policy public.mednest_academic_review_policies%rowtype;
begin
 if not public.mednest_staff_sensitive_authorized(p_actor,p_session,'staff.permissions.update')
   then raise exception 'chief_email_stepup_required'; end if;
 if p_mode not in('direct','one','two') then raise exception 'invalid_review_mode'; end if;
 update public.mednest_academic_review_policies
  set review_mode=p_mode,version=version+1,updated_by=p_actor,updated_at=statement_timestamp()
  where scope='mcq_correction' and version=p_expected_version
  returning * into v_policy;
 if v_policy.scope is null then raise exception 'review_policy_version_conflict'; end if;
 insert into public.mednest_staff_audit(actor_user_id,action,details)
  values(p_actor,'academic.review_policy_changed',
   jsonb_build_object('mode',p_mode,'version',v_policy.version));
 return jsonb_build_object('mode',v_policy.review_mode,'version',v_policy.version);
end;
$$;
revoke all on function public.mednest_academic_review_set_policy(uuid,uuid,text,integer)
 from public,anon,authenticated;
grant execute on function public.mednest_academic_review_set_policy(uuid,uuid,text,integer) to service_role;

-- Freeze submitted draft content and source revision into an independent review record.
-- A direct policy only authorizes ready-for-release, NOT student publication.
create or replace function public.mednest_academic_review_submit(
 p_actor uuid,p_session uuid,p_draft uuid,p_expected_version integer
) returns jsonb language plpgsql security invoker set search_path=pg_catalog
as $$
declare d public.mednest_mcq_edit_drafts%rowtype;
 v_policy text;v_required integer;v_id uuid;v_state text;
begin
 if not public.mednest_staff_session_live(p_actor,p_session) or not exists (
  select 1 from public.mednest_staff_members m where m.user_id=p_actor
   and m.status='active' and (m.technical_role='chief_admin' or 'content.edit'=any(m.permissions))
 ) then raise exception 'academic_editor_session_required'; end if;
 select * into d from public.mednest_mcq_edit_drafts
  where id=p_draft and owner_user_id=p_actor and state='draft' for update;
 if not found or d.version<>p_expected_version then raise exception 'stale_or_missing_edit_draft'; end if;
 if exists(select 1 from public.mednest_academic_review_submissions
  where draft_id=p_draft and state in ('pending','approved_for_release')) then
  raise exception 'review_already_in_progress'; end if;
 select review_mode into v_policy from public.mednest_academic_review_policies
  where scope='mcq_correction';
 if v_policy is null then raise exception 'review_policy_missing'; end if;
 v_required=case when v_policy='two' then 2 when v_policy='one' then 1 else 0 end;
 v_state=case when v_required=0 then 'approved_for_release' else 'pending' end;
 insert into public.mednest_academic_review_submissions(
  draft_id,author_user_id,source_mcq_id,source_bank,source_revision_id,
  submitted_draft_version,submitted_fields,syllabus_topic_id,policy_mode,required_reviewers,state
 ) values(p_draft,p_actor,d.source_mcq_id,d.source_bank,d.original_revision_id,
  d.version,d.edited_fields,d.syllabus_topic_id,v_policy,v_required,v_state)
 returning id into v_id;
 insert into public.mednest_staff_audit(actor_user_id,action,details)
  values(p_actor,'academic.review_submitted',jsonb_build_object(
   'submission_id',v_id,'draft_id',p_draft,'required_reviewers',v_required,'state',v_state));
 return jsonb_build_object('id',v_id,'state',v_state,'required_reviewers',v_required,
  'published',false);
end;
$$;
revoke all on function public.mednest_academic_review_submit(uuid,uuid,uuid,integer)
 from public,anon,authenticated;
grant execute on function public.mednest_academic_review_submit(uuid,uuid,uuid,integer) to service_role;

-- Only a DIFFERENT authorized academic reviewer can approve/reject a submission.
-- 2-reviewer policy requires two unique member identities; the author counts as neither.
create or replace function public.mednest_academic_review_decide(
 p_actor uuid,p_session uuid,p_submission uuid,p_decision text,p_reason text
) returns jsonb language plpgsql security invoker set search_path=pg_catalog
as $$
declare s public.mednest_academic_review_submissions%rowtype;v_state text;
begin
 if not public.mednest_staff_session_live(p_actor,p_session) or not exists (
  select 1 from public.mednest_staff_members m where m.user_id=p_actor and m.status='active'
   and (m.technical_role='chief_admin' or 'content.review'=any(m.permissions))
 ) then raise exception 'academic_reviewer_session_required'; end if;
 if p_decision not in ('approve','request_changes')
  then raise exception 'unsupported_review_decision'; end if;
 select * into s from public.mednest_academic_review_submissions
  where id=p_submission and state='pending' for update;
 if not found then raise exception 'pending_review_not_found'; end if;
 if p_actor=s.author_user_id or p_actor=s.review_1_user_id
    or p_actor=s.review_2_user_id then raise exception 'independent_reviewer_required'; end if;
 if p_decision='request_changes' then
  if char_length(btrim(coalesce(p_reason,''))) not between 5 and 1000
   then raise exception 'review_reason_required'; end if;
  update public.mednest_academic_review_submissions
   set state='needs_changes',rejection_reason=btrim(p_reason),updated_at=statement_timestamp()
   where id=p_submission;
  v_state='needs_changes';
 elsif s.review_1_user_id is null then
  v_state=case when s.required_reviewers=1 then 'approved_for_release' else 'pending' end;
  update public.mednest_academic_review_submissions
   set review_1_user_id=p_actor,state=v_state,updated_at=statement_timestamp()
   where id=p_submission;
 else
  if s.required_reviewers<>2 or s.review_2_user_id is not null then
   raise exception 'review_limit_reached'; end if;
  update public.mednest_academic_review_submissions
   set review_2_user_id=p_actor,state='approved_for_release',updated_at=statement_timestamp()
   where id=p_submission;
  v_state='approved_for_release';
 end if;
 insert into public.mednest_staff_audit(actor_user_id,action,details)
  values(p_actor,'academic.review_'||p_decision,
   jsonb_build_object('submission_id',p_submission,'state',v_state));
 return jsonb_build_object('id',p_submission,'state',v_state,'published',false);
end;
$$;
revoke all on function public.mednest_academic_review_decide(uuid,uuid,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.mednest_academic_review_decide(uuid,uuid,uuid,text,text) to service_role;

-- Author can revoke a pending submission without deleting any audit or review history.
create or replace function public.mednest_academic_review_withdraw(
 p_actor uuid,p_session uuid,p_submission uuid
) returns jsonb language plpgsql security invoker set search_path=pg_catalog
as $$
declare v_row public.mednest_academic_review_submissions%rowtype;
begin
 if not public.mednest_staff_session_live(p_actor,p_session) then
  raise exception 'session_required'; end if;
 update public.mednest_academic_review_submissions
  set state='withdrawn',updated_at=statement_timestamp()
  where id=p_submission and author_user_id=p_actor and state='pending'
  returning * into v_row;
 if v_row.id is null then raise exception 'withdraw_not_allowed'; end if;
 insert into public.mednest_staff_audit(actor_user_id,action,details)
  values(p_actor,'academic.review_withdrawn',jsonb_build_object('submission_id',p_submission));
 return jsonb_build_object('id',p_submission,'state','withdrawn','published',false);
end;
$$;
revoke all on function public.mednest_academic_review_withdraw(uuid,uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.mednest_academic_review_withdraw(uuid,uuid,uuid) to service_role;
