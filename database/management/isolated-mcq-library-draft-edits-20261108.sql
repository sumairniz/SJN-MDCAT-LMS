-- SJN MedNest Management: staged, non-publishing revisions of existing MCQs.
-- This migration runs ONLY in the independent Management Auth Supabase.
-- Never touch Student mcqs/mcq_revisions, historical answers or course content.
create table if not exists public.mednest_mcq_edit_drafts (
 id uuid primary key default gen_random_uuid(),
 owner_user_id uuid not null references public.mednest_staff_members(user_id) on delete restrict,
 source_mcq_id bigint not null check(source_mcq_id>0),
 source_bank text not null check(length(source_bank) between 1 and 120),
 original_revision_id bigint not null check(original_revision_id>0),
 original_fields jsonb not null check(jsonb_typeof(original_fields)='object' and octet_length(original_fields::text)<=50000),
 edited_fields jsonb not null check(jsonb_typeof(edited_fields)='object' and octet_length(edited_fields::text)<=50000),
 syllabus_topic_id uuid null references public.mednest_syllabus_nodes(id) on delete restrict,
 state text not null default 'draft' check(state in ('draft','discarded')),
 version integer not null default 1 check(version between 1 and 10000000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(owner_user_id,source_mcq_id)
);
create index if not exists mednest_mcq_edit_drafts_owner_updated
 on public.mednest_mcq_edit_drafts(owner_user_id,updated_at desc);

alter table public.mednest_mcq_edit_drafts enable row level security;
revoke all on table public.mednest_mcq_edit_drafts from public,anon,authenticated;
grant select,insert,update on public.mednest_mcq_edit_drafts to service_role;

-- Direct Chief-only RPC. No cross-project student mutation is possible from here.
-- Explicit version gate prevents overwriting edits from another browser tab.
create or replace function public.mednest_mcq_edit_save_draft(
 p_actor uuid,p_session uuid,p_mcq_id bigint,p_bank text,p_revision bigint,
 p_original jsonb,p_edited jsonb,p_topic uuid,p_expected_version integer
) returns jsonb
language plpgsql security invoker set search_path=pg_catalog
as $$
declare v_row public.mednest_mcq_edit_drafts%rowtype;
  v_topic_kind text; v_topic_state text;
  v_parent_kind text; v_parent_state text;
  v_subject_state text;
begin
 if not public.mednest_staff_session_live(p_actor,p_session) or not exists (
  select 1 from public.mednest_staff_members m
  where m.user_id=p_actor and m.technical_role='chief_admin' and m.status='active'
 ) then raise exception 'chief_session_required'; end if;
 if p_mcq_id is null or p_mcq_id<=0 or p_revision is null or p_revision<=0
    or p_bank is null or length(p_bank) not between 1 and 120
    or jsonb_typeof(p_original)<>'object'
    or jsonb_typeof(p_edited)<>'object'
    or octet_length(p_original::text)>50000
    or octet_length(p_edited::text)>50000
    or p_expected_version is null or p_expected_version<0
 then raise exception 'invalid_mcq_edit'; end if;
 if p_topic is not null then
  select kind,state into v_topic_kind,v_topic_state
   from public.mednest_syllabus_nodes where id=p_topic;
  if v_topic_kind is distinct from 'topic' or v_topic_state is distinct from 'active'
    then raise exception 'approved_syllabus_topic_required'; end if;
  select kind,state into v_parent_kind,v_parent_state
   from public.mednest_syllabus_nodes
   where id=(select parent_id from public.mednest_syllabus_nodes where id=p_topic);
  if v_parent_kind is distinct from 'chapter' or v_parent_state is distinct from 'active'
    then raise exception 'approved_chapter_required'; end if;
  select state into v_subject_state
   from public.mednest_syllabus_nodes
   where id=(select p.parent_id from public.mednest_syllabus_nodes t
     join public.mednest_syllabus_nodes p on p.id=t.parent_id where t.id=p_topic);
  if v_subject_state is distinct from 'active'
    then raise exception 'approved_subject_required'; end if;
 end if;
 if p_expected_version=0 then
  insert into public.mednest_mcq_edit_drafts(
   owner_user_id,source_mcq_id,source_bank,original_revision_id,
   original_fields,edited_fields,syllabus_topic_id
  ) values (p_actor,p_mcq_id,p_bank,p_revision,p_original,p_edited,p_topic)
   on conflict(owner_user_id,source_mcq_id) do nothing
   returning * into v_row;
 else
  update public.mednest_mcq_edit_drafts
  set edited_fields=p_edited,syllabus_topic_id=p_topic,
      version=version+1,updated_at=statement_timestamp()
  where owner_user_id=p_actor and source_mcq_id=p_mcq_id
    and original_revision_id=p_revision and source_bank=p_bank
    and version=p_expected_version and state='draft'
  returning * into v_row;
 end if;
 if v_row.id is null then
  raise exception 'stale_draft_or_baseline_conflict'; end if;
 insert into public.mednest_staff_audit(actor_user_id,action,details)
  values(p_actor,'content.mcq_edit_draft_saved',
   jsonb_build_object('draft_id',v_row.id,'mcq_id',p_mcq_id,
    'revision_id',p_revision,'draft_version',v_row.version));
 return jsonb_build_object('id',v_row.id,'mcq_id',v_row.source_mcq_id,
  'source_revision_id',v_row.original_revision_id,
  'version',v_row.version,'state',v_row.state);
end;
$$;
revoke all on function public.mednest_mcq_edit_save_draft(
 uuid,uuid,bigint,text,bigint,jsonb,jsonb,uuid,integer
) from public,anon,authenticated;
grant execute on function public.mednest_mcq_edit_save_draft(
 uuid,uuid,bigint,text,bigint,jsonb,jsonb,uuid,integer
) to service_role;

comment on table public.mednest_mcq_edit_drafts is
 'Chief-authenticated proposed edits only. Original student MCQs, course content and revision history remain in isolated student project, not modifiable here.';
