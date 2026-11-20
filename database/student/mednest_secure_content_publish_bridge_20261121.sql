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



revoke all on function public.mednest_publish_mcq_batch(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.mednest_publish_mcq_batch(uuid,uuid,text,jsonb) to service_role;
