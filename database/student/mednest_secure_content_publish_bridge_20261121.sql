-- SJN MedNest secure content publishing bridge — Student LMS Staging only.
create table if not exists public.mednest_content_publish_receipts (
 request_id uuid primary key,
 actor_user_id uuid not null,
 payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
 result jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.mednest_content_publish_receipts enable row level security;
revoke all on table public.mednest_content_publish_receipts from anon,authenticated,public;
grant select,insert,update,delete on table public.mednest_content_publish_receipts to service_role;



CREATE OR REPLACE FUNCTION public.mednest_publish_mcq_batch(p_request_id uuid, p_actor_user_id uuid, p_payload_hash text, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_existing public.mednest_content_publish_receipts%rowtype;
  v_item jsonb;
  v_fields jsonb;
  v_results jsonb := '[]'::jsonb;
  v_bank text; v_subject text; v_chapter text; v_topic text; v_source text;
  v_question text; v_options jsonb; v_correct integer;
  v_explanation text; v_mnemonic text;
  v_mcq_id bigint; v_revision_id bigint; v_revision_no integer;
  v_expected bigint; v_mode text; v_count integer := 0;
begin
  if p_request_id is null or p_actor_user_id is null
     or p_payload_hash is null or p_payload_hash !~ '^[0-9a-f]{64}$'
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 40 then
    raise exception 'Invalid publishing request';
  end if;
  select * into v_existing from public.mednest_content_publish_receipts
   where request_id=p_request_id for update;
  if found then
    if v_existing.actor_user_id<>p_actor_user_id or v_existing.payload_hash<>p_payload_hash then
      raise exception 'Idempotency key conflict';
    end if;
    return v_existing.result || jsonb_build_object('replayed',true);
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_count:=v_count+1; v_fields:=v_item->'fields';
    if jsonb_typeof(v_fields)<>'object' then raise exception 'Question % has invalid fields',v_count; end if;
    v_bank:=v_fields->>'bank'; v_subject:=nullif(btrim(v_fields->>'subject'),'');
    v_chapter:=nullif(btrim(v_fields->>'chapter'),''); v_topic:=nullif(btrim(v_fields->>'topic'),'');
    v_source:=nullif(btrim(v_fields->>'source'),''); v_question:=v_fields->>'question';
    v_explanation:=coalesce(v_fields->>'explanation',''); v_mnemonic:=coalesce(v_fields->>'mnemonic','');
    v_mode:=coalesce(v_item->>'mode','create');
    if v_bank is null or v_bank not in ('SJN Question Bank','Past Papers Question Bank',
      'BUMHS MDCAT Past Papers','KMU MDCAT Past Papers','NUMS MDCAT Past Papers',
      'SIBA MDCAT Past Papers','SZABMU MDCAT Past Papers','UHS MDCAT Past Papers') then
      raise exception 'Question % has unsupported or restricted destination',v_count;
    end if;
    if v_bank='SJN MedNest Course Tests' then raise exception 'Course-only publishing blocked by FF-008'; end if;
    if v_subject not in ('Biology','Chemistry','Physics','English','Logical Reasoning')
       or v_question is null or length(v_question)>6000
       or length(v_explanation)>6000 or length(v_mnemonic)>2000
       or (v_bank<>'SJN Question Bank' and v_source is null) then
      raise exception 'Question % has invalid required content',v_count;
    end if;
    v_options:=jsonb_build_array(v_fields->>'option_a',v_fields->>'option_b',v_fields->>'option_c',v_fields->>'option_d');
    if exists(select 1 from jsonb_array_elements_text(v_options) as x(option_value)
              where btrim(x.option_value)='' or length(x.option_value)>6000) then
      raise exception 'Question % must contain exactly four valid options',v_count;
    end if;
    if (select count(distinct lower(btrim(x.option_value))) from jsonb_array_elements_text(v_options) as x(option_value))<>4 then
      raise exception 'Question % contains duplicate options',v_count;
    end if;
    v_correct:=strpos('ABCD',upper(coalesce(v_fields->>'correct_option','')))-1;
    if v_correct<0 or v_correct>3 then raise exception 'Question % has invalid correct answer',v_count; end if;
    if nullif(btrim(v_fields->>'option_e'),'') is not null then
      raise exception 'Five-option questions are not supported by the four-option Student LMS schema';
    end if;

    if v_mode='edit' then
      v_mcq_id:=(v_item->>'mcq_id')::bigint; v_expected:=(v_item->>'expected_revision_id')::bigint;
      perform 1 from public.mcqs where id=v_mcq_id for update;
      if not found then raise exception 'Question % source MCQ not found',v_count; end if;
      if (select current_revision_id from public.mcqs where id=v_mcq_id) is distinct from v_expected then
        raise exception 'Question % has stale published revision',v_count;
      end if;
      if (select bank from public.mcqs where id=v_mcq_id) is distinct from v_bank then
        raise exception 'Question % cannot change original bank',v_count;
      end if;
      select coalesce(max(revision_no),0)+1 into v_revision_no from public.mcq_revisions where mcq_id=v_mcq_id;
    elsif v_mode='create' then
      v_mcq_id:=nextval('public.mcqs_id_seq'); v_revision_no:=1;
      insert into public.mcqs(id,bank,subject,chapter,topic,question,options_json,correct_index,explanation,mnemonic,source)
      values(v_mcq_id,v_bank,v_subject,v_chapter,v_topic,v_question,v_options,v_correct,v_explanation,v_mnemonic,v_source);
    else
      raise exception 'Question % has invalid publishing mode',v_count;
    end if;

    v_revision_id:=nextval('public.mcq_revisions_id_seq');
    insert into public.mcq_revisions(id,mcq_id,revision_no,bank,subject,chapter,topic,source,question,
      options_json,correct_index,explanation,mnemonic)
    values(v_revision_id,v_mcq_id,v_revision_no,v_bank,v_subject,v_chapter,v_topic,v_source,v_question,
      v_options,v_correct,v_explanation,v_mnemonic);
    update public.mcqs set bank=v_bank,subject=v_subject,chapter=v_chapter,topic=v_topic,
      question=v_question,options_json=v_options,correct_index=v_correct,explanation=v_explanation,
      mnemonic=v_mnemonic,source=v_source,current_revision_id=v_revision_id where id=v_mcq_id;
    v_results:=v_results||jsonb_build_array(jsonb_build_object(
      'mcq_id',v_mcq_id,'revision_id',v_revision_id,'revision_no',v_revision_no,'mode',v_mode,'bank',v_bank));
  end loop;

  v_results:=jsonb_build_object('request_id',p_request_id,'actor_user_id',p_actor_user_id,
    'published_count',v_count,'items',v_results,'replayed',false);
  insert into public.mednest_content_publish_receipts(request_id,actor_user_id,payload_hash,result)
  values(p_request_id,p_actor_user_id,p_payload_hash,v_results);
  return v_results;
end;
$function$

revoke all on function public.mednest_publish_mcq_batch(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.mednest_publish_mcq_batch(uuid,uuid,text,jsonb) to service_role;
