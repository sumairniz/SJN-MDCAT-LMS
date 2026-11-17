-- SJN MedNest Management Auth only: restrict the audit trigger function from API RPC execution.
-- Apply ONLY to tdqbjhrmfluiinntmjfh (SJN MedNest Management Auth).
-- Do not apply to Student LMS staging or the retired initial production project.
--
-- The function is attached to mednest_content_draft_batches as an INSERT / status UPDATE
-- trigger. It is not an application RPC. Existing trigger remains attached and operational.
-- Keep the owner and trusted service_role privileges; remove default PUBLIC API execution.
REVOKE ALL ON FUNCTION public.mednest_content_batch_audit_status()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mednest_content_batch_audit_status()
  TO service_role;
