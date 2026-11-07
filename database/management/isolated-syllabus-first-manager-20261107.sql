-- SJN MedNest Academy: syllabus-first canonical registry.
-- DEDICATED MANAGEMENT AUTH ONLY: tdqbjhrmfluiinntmjfh.
-- No student mcqs, source keys, test history or production database changes.
create table if not exists public.mednest_syllabus_nodes (
 id uuid primary key default gen_random_uuid(),
 parent_id uuid references public.mednest_syllabus_nodes(id) on delete restrict,
 kind text not null check(kind in ('subject','chapter','topic')),
 name text not null check(char_length(btrim(name)) between 1 and 160 and name !~ '[[:cntrl:]]'),
 name_key text generated always as
   (lower(regexp_replace(btrim(name),'[[:space:]]+',' ','g'))) stored,
 state text not null default 'draft' check(state in ('draft','active','archived')),
 display_order integer not null default 0 check(display_order between 0 and 1000000),
 revision integer not null default 1 check(revision>=1),
 created_by uuid not null references public.mednest_staff_members(user_id) on delete restrict,
 updated_by uuid not null references public.mednest_staff_members(user_id) on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((kind='subject' and parent_id is null) or
        (kind in ('chapter','topic') and parent_id is not null))
);
-- Case-insensitive and whitespace-normalized unique canonical labels per parent/kind.
-- Archive releases a visible label for a new version without deleting history.
create unique index if not exists mednest_syllabus_unique_live_siblings
 on public.mednest_syllabus_nodes(
  (coalesce(parent_id,'00000000-0000-0000-0000-000000000000'::uuid)), kind, name_key
 ) where state <> 'archived';
create index if not exists mednest_syllabus_parent_order
 on public.mednest_syllabus_nodes(parent_id,display_order,name);

create or replace function public.mednest_syllabus_parent_guard()
returns trigger language plpgsql security invoker set search_path=pg_catalog
as $$
declare v_kind text; v_state text;
begin
 if tg_op='UPDATE' and (new.kind<>old.kind or new.id<>old.id) then
  raise exception 'syllabus_kind_immutable';
 end if;
 if new.kind='subject' and new.parent_id is not null then
  raise exception 'subject_must_be_root';
 end if;
 if new.kind<>'subject' then
  if new.parent_id=new.id then raise exception 'syllabus_parent_cycle'; end if;
  select kind,state into v_kind,v_state from public.mednest_syllabus_nodes
   where id=new.parent_id for share;
  if v_kind is null or v_kind <> case when new.kind='chapter' then 'subject' else 'chapter' end
   then raise exception 'syllabus_parent_kind_mismatch'; end if;
  if new.state='active' and v_state<>'active' then
   raise exception 'cannot_activate_under_inactive_parent'; end if;
 end if;
 if tg_op='UPDATE' then
  new.updated_at=statement_timestamp();
  new.revision=old.revision+1;
 end if;
 return new;
end;
$$;
drop trigger if exists mednest_syllabus_parent_guard_trigger on public.mednest_syllabus_nodes;
create trigger mednest_syllabus_parent_guard_trigger
before insert or update on public.mednest_syllabus_nodes
for each row execute function public.mednest_syllabus_parent_guard();

alter table public.mednest_syllabus_nodes enable row level security;
revoke all on public.mednest_syllabus_nodes from public,anon,authenticated;
grant select,insert,update on public.mednest_syllabus_nodes to service_role;

-- Atomic operation with second in-database Chief/session check and one audit entry.
create or replace function public.mednest_syllabus_change(
 p_actor uuid,p_session uuid,p_action text,p_node_id uuid,p_kind text,
 p_parent_id uuid,p_name text
) returns jsonb
language plpgsql security invoker set search_path=pg_catalog
as $$
declare v_node public.mednest_syllabus_nodes%rowtype;
 v_n integer:=0;v_name text;v_id uuid;
begin
 if not public.mednest_staff_session_live(p_actor,p_session) or not exists (
   select 1 from public.mednest_staff_members m
    where m.user_id=p_actor and m.technical_role='chief_admin' and m.status='active'
 ) then raise exception 'chief_session_required'; end if;
 if p_action='create' then
   if p_kind not in ('subject','chapter','topic') or p_name is null
     then raise exception 'invalid_syllabus_node'; end if;
   v_name=regexp_replace(btrim(p_name),'[[:space:]]+',' ','g');
   if length(v_name)<1 or length(v_name)>160 then raise exception 'invalid_syllabus_name'; end if;
   insert into public.mednest_syllabus_nodes(kind,parent_id,name,created_by,updated_by)
    values(p_kind,p_parent_id,v_name,p_actor,p_actor)
    returning * into v_node;
 elsif p_action in ('rename','move','archive','restore','activate') then
   select * into v_node from public.mednest_syllabus_nodes where id=p_node_id for update;
   if not found then raise exception 'syllabus_node_not_found'; end if;
   if p_action='rename' then
     v_name=regexp_replace(btrim(coalesce(p_name,'')),'[[:space:]]+',' ','g');
     if length(v_name)<1 or length(v_name)>160 then raise exception 'invalid_syllabus_name'; end if;
     if v_node.state='archived' then raise exception 'restore_before_renaming'; end if;
     update public.mednest_syllabus_nodes set name=v_name,updated_by=p_actor
      where id=p_node_id returning * into v_node;
   elsif p_action='move' then
     if v_node.kind='subject' or v_node.state='archived' then
       raise exception 'only_active_or_draft_chapter_topic_can_move'; end if;
     update public.mednest_syllabus_nodes set parent_id=p_parent_id,updated_by=p_actor
      where id=p_node_id returning * into v_node;
   elsif p_action='archive' then
     with recursive tree as (
       select id from public.mednest_syllabus_nodes where id=p_node_id
       union all
       select c.id from public.mednest_syllabus_nodes c
        join tree t on c.parent_id=t.id
     )
     update public.mednest_syllabus_nodes n
      set state='archived',updated_by=p_actor where n.id in(select id from tree)
        and n.state<>'archived';
     get diagnostics v_n=row_count;
   elsif p_action='restore' then
     if v_node.state<>'archived' then raise exception 'not_archived'; end if;
     update public.mednest_syllabus_nodes set state='draft',updated_by=p_actor
       where id=p_node_id returning * into v_node;
   elsif p_action='activate' then
     if v_node.kind<>'subject' or v_node.state='archived' then
       raise exception 'activate_subject_root_only'; end if;
     -- Parent-first, one database transaction. Archived children remain archived.
     update public.mednest_syllabus_nodes set state='active',updated_by=p_actor
       where id=p_node_id and state='draft';
     update public.mednest_syllabus_nodes set state='active',updated_by=p_actor
       where parent_id=p_node_id and kind='chapter' and state='draft';
     update public.mednest_syllabus_nodes t set state='active',updated_by=p_actor
       from public.mednest_syllabus_nodes c
       where t.parent_id=c.id and c.parent_id=p_node_id
         and c.kind='chapter' and c.state='active' and t.kind='topic' and t.state='draft';
   end if;
 else raise exception 'unsupported_syllabus_action'; end if;
 insert into public.mednest_staff_audit(actor_user_id,action,details)
  values(p_actor,'syllabus.'||p_action,
   jsonb_build_object('node_id',coalesce(p_node_id,v_node.id),'kind',coalesce(p_kind,v_node.kind),'affected',v_n));
 return jsonb_build_object('success',true,'id',coalesce(p_node_id,v_node.id),
   'action',p_action,'affected',v_n);
end;
$$;
revoke all on function public.mednest_syllabus_change(uuid,uuid,text,uuid,text,uuid,text)
 from public,anon,authenticated;
grant execute on function public.mednest_syllabus_change(uuid,uuid,text,uuid,text,uuid,text)
 to service_role;

-- Idempotent upload of a syllabus outline; creates draft nodes only.
-- No student data is read or written. Every chunk is a single transaction.
create or replace function public.mednest_syllabus_stage_outline(
 p_actor uuid,p_session uuid,p_rows jsonb
) returns jsonb
language plpgsql security invoker set search_path=pg_catalog
as $$
declare v_row jsonb;v_subject text;v_chapter text;v_topic text;
 v_sid uuid;v_cid uuid;v_tid uuid;
 v_created integer:=0;v_skipped integer:=0;v_total integer:=0;
begin
 if not public.mednest_staff_session_live(p_actor,p_session) or not exists (
  select 1 from public.mednest_staff_members m
  where m.user_id=p_actor and m.technical_role='chief_admin' and m.status='active'
 ) then raise exception 'chief_session_required'; end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)<1
    or jsonb_array_length(p_rows)>100 then raise exception 'invalid_outline_chunk'; end if;
 for v_row in select value from jsonb_array_elements(p_rows) loop
   if jsonb_typeof(v_row)<>'object' or
      (select count(*) from jsonb_object_keys(v_row))>3 or
      (select bool_or(k not in ('subject','chapter','topic'))
       from jsonb_object_keys(v_row) k)
   then raise exception 'invalid_outline_fields'; end if;
   v_subject=regexp_replace(btrim(coalesce(v_row->>'subject','')),'[[:space:]]+',' ','g');
   v_chapter=regexp_replace(btrim(coalesce(v_row->>'chapter','')),'[[:space:]]+',' ','g');
   v_topic=regexp_replace(btrim(coalesce(v_row->>'topic','')),'[[:space:]]+',' ','g');
   if length(v_subject) not between 1 and 160 or length(v_chapter)>160
      or length(v_topic)>160 or (v_topic<>'' and v_chapter='')
      or v_subject ~ '[[:cntrl:]]' or v_chapter ~ '[[:cntrl:]]' or v_topic ~ '[[:cntrl:]]'
     then raise exception 'invalid_outline_row'; end if;
   v_total=v_total+1;
   select id into v_sid from public.mednest_syllabus_nodes
    where kind='subject' and parent_id is null and
     name_key=lower(v_subject) and state<>'archived' limit 1;
   if v_sid is null then
     insert into public.mednest_syllabus_nodes(kind,name,created_by,updated_by)
      values('subject',v_subject,p_actor,p_actor)
      on conflict do nothing returning id into v_sid;
     if v_sid is not null then v_created=v_created+1;else
       select id into v_sid from public.mednest_syllabus_nodes
        where kind='subject' and parent_id is null and name_key=lower(v_subject)
          and state<>'archived' limit 1;
     end if;
   end if;
   if v_sid is null then raise exception 'subject_resolution_failed'; end if;
   if v_chapter<>'' then
     v_cid=null;
     select id into v_cid from public.mednest_syllabus_nodes
      where kind='chapter' and parent_id=v_sid and
       name_key=lower(v_chapter) and state<>'archived' limit 1;
     if v_cid is null then
       insert into public.mednest_syllabus_nodes(kind,parent_id,name,created_by,updated_by)
        values('chapter',v_sid,v_chapter,p_actor,p_actor)
        on conflict do nothing returning id into v_cid;
       if v_cid is not null then v_created=v_created+1;else
         select id into v_cid from public.mednest_syllabus_nodes
          where kind='chapter' and parent_id=v_sid and name_key=lower(v_chapter)
            and state<>'archived' limit 1;
       end if;
     end if;
     if v_cid is null then raise exception 'chapter_resolution_failed'; end if;
   end if;
   if v_topic<>'' then
     v_tid=null;
     select id into v_tid from public.mednest_syllabus_nodes
      where kind='topic' and parent_id=v_cid and
       name_key=lower(v_topic) and state<>'archived' limit 1;
     if v_tid is null then
       insert into public.mednest_syllabus_nodes(kind,parent_id,name,created_by,updated_by)
        values('topic',v_cid,v_topic,p_actor,p_actor)
        on conflict do nothing returning id into v_tid;
       if v_tid is not null then v_created=v_created+1;else
         select id into v_tid from public.mednest_syllabus_nodes
          where kind='topic' and parent_id=v_cid and name_key=lower(v_topic)
            and state<>'archived' limit 1;
       end if;
     end if;
     if v_tid is null then raise exception 'topic_resolution_failed'; end if;
   end if;
 end loop;
 v_skipped=v_total;
 insert into public.mednest_staff_audit(actor_user_id,action,details)
  values(p_actor,'syllabus.outline_staged',
   jsonb_build_object('rows',v_total,'created_nodes',v_created));
 return jsonb_build_object('processed',v_total,'created_nodes',v_created);
end;
$$;
revoke all on function public.mednest_syllabus_stage_outline(uuid,uuid,jsonb)
 from public,anon,authenticated;
grant execute on function public.mednest_syllabus_stage_outline(uuid,uuid,jsonb)
 to service_role;
