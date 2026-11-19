-- Management Auth only: indexes for audit FK lookups. No student database writes.
create index if not exists mednest_staff_audit_actor_user_id_idx on public.mednest_staff_audit(actor_user_id);
create index if not exists mednest_staff_audit_target_user_id_idx on public.mednest_staff_audit(target_user_id) where target_user_id is not null;
