# SJN MedNest Management — Step 2 Sensitive Operations Security Policy and Implementation

**Checkpoint:** 7 November 2026, Asia/Karachi  
**Branch:** `sjn-phase1a-foundation`  
**Approval source:** Owner explicitly requested implementing Step 2 after finalizing student access as ordinary permission-controlled activity and confirming high-risk actions.  
**Status:** Sensitive action **verification foundation implemented on isolated staff Auth**; server-only SQL checks, active Edge Function and separate preview UI. **End-to-end email delivery not validated and staff-sensitive mutations are NOT yet enabled.** The Management Panel still uses the old staging Auth until a safe cutover. No student LMS writes.

## Final owner product decisions and recommended enforcement

### Ordinary authorized work — NO emailed security code
- Lock or unlock any feature for a student, grant/revoke a course/feature entitlement, suspend/re-enable student access or globally restrict a student's Academy access, **only if the staff role has the corresponding permission**. These changes need actor, target, before/after, timestamp and reason audit trails, plus confirmation for impactful changes; no step-up email code.
- MCQ editing, academic tests/courses, ordinary profile name/title, dashboard, reports and normal email/password login also have no step-up; they require ordinary role permissions.
- **This is a POLICY decision only:** the actual student entitlement/control APIs were not implemented during this Step 2 batch and still need a narrowly scoped, server-only cross-project bridge. No student account, content or entitlement was changed by this task.

### Sensitive operations — 8-digit email code
- `staff.invite`, `staff.permissions.update`, `staff.suspend`, `staff.reactivate`, `staff.remove`, `staff.invite.revoke`
- `chief.email.change` (also requires independent confirmation of the new mailbox before replacing old login email, subject to separately reviewed recovery flow)
- `students.records.delete` and `bulk.destructive.execute`; prefer reversible soft delete and dry-run/preview when feasible
- These are **Chief Administrator-only by default** in the implemented gate; delegation of staff security or irreversible deletion is NOT implicitly authorized for ordinary members.

### Session timing and interrupted operations — final policy
1. Code is sent **only to the verified Chief Administrator email in dedicated staff Auth**. Code expires **10 minutes after send**, keyed-hashed and never returned to frontend or stored as plaintext.
2. After successful verification, **30 minutes from that instant** of authorization for these sensitive operations in that **same current signed-in Auth session**. Refreshing login, changing device or opening another session does not transfer it. No rolling extension by repeatedly clicking actions. No compulsory verification for normal work.
3. When the 30 minutes expire while *editing*: preserve the UI draft and request a fresh code **on final submit**. The server must re-check authorization **inside the same database transaction** that performs the mutation; checking only when opening a form is forbidden.
4. **Atomic transaction:** once the server successfully validates a sensitive action at the operation's transaction start, it may complete the transaction even if the timer passes the threshold during execution; do not interrupt halfway or return success before commit.
5. **Bulk/destructive jobs:** present review/impact preview and confirmation. Each independently committed batch must re-check the verified window before starting. If the window expires between batches, **pause before the next batch**, preserve successful checkpoint/operation IDs, ask for a fresh email code, then resume only unfinished batches idempotently. No partial-row writes, no duplicate/delete twice, no claiming completion before confirmation. Server-side protected audit and status reporting required.
6. Suspended staff, session revocation or invalid credentials always fail closed. If permissions change or session expires **before a new batch**, stop it even if an earlier batch was authorized. Reauthentication and step-up are separate.
7. Sensitive-action categories may be expanded only with explicit product approval; never classify all student feature locking as destructive records deletion.

## Implemented — dedicated Supabase project ONLY

- Database migration `mednest_isolated_staff_stepup_policy_20261107`: `public.mednest_staff_stepup` and `public.mednest_staff_stepup_daily_quota` are RLS-enabled, without `anon`/`authenticated` grants/policies. Chief-only, session-scoped server RPCs:
  - `mednest_staff_stepup_reserve`: 90-second send throttle, 5 emails per UTC day across sessions, atomic advisory-lock quota protection, latest 10-minute hashed challenge.
  - `mednest_staff_stepup_verify`: 5 bad attempts maximum, one-use code, records 30-minute `verified_until`, audits success without email or code.
  - `mednest_staff_sensitive_authorized`: service-role-only execution-time check for the exact listed action, active Chief, verified login email and live session, matching unexpired authorization.
- GitHub source: `database/management/isolated-staff-stepup-policy.sql`; **applied only to `tdqbjhrmfluiinntmjfh`**, not to student staging `aozknkrwafowsrehdwlr`.
- Edge function `mednest-isolated-stepup` **ACTIVE v1**, `verify_jwt=true`: `status`, `send`, `verify`; independently checks Auth issuer, user, confirmed email, session, Chief authorization, origin; uses cryptographically uniform 8-digit code, HMAC-SHA256 with required `MEDNEST_STAFF_EMAIL_PEPPER`, and sends only through Resend using `RESEND_API_KEY` and `MEDNEST_STAFF_EMAIL_FROM`. Missing sender/pepper => **fail closed**; no code is sent.
- Optional isolated Owner test UI in `apps/management/isolated-auth-preview.{html,js,css}`: shows verification status; send code/verify only if configured, no student or staff mutations; removed obsolete initial Chief account setup button. **Production Management Panel login remains unchanged**. After verified email test, UI may be integrated into actual sensitive staff operations.
- Tests `tests/management-isolated-auth.test.js`: no public signup on isolated preview, protected RPC/source, timing policy and sender fail-closed check. GitHub final code commit `c0db5cd11d146093830a8f3824970742d3f44c1c`, two CI workflows **SUCCESS**. Vercel **preview only**, READY deployment `dpl_EfDaAgUYftxUTHJjaGvtjzxr4UwV`, URL `https://sjn-mednest-management-kgnp7jswz-sjn1.vercel.app/isolated-auth-preview.html`. No production release.
- Live Supabase read-only verification: new step-up tables have RLS enabled, no anon/authenticated SELECT; all 3 privileged RPCs have no anon/authenticated EXECUTE and service-role EXECUTE only. Negative unapproved identity returned `false` / `denied`. No challenge rows were created during tests.
- Security advisor: `rls_enabled_no_policy` INFO is intentionally fail-closed for server-only staff tables; `auth_leaked_password_protection` WARN requires separate Auth settings/plan evaluation (not quietly changed). Performance advisor `unused_index` INFO reflects new tables not yet receiving traffic. No material student-side performance impact was introduced.

## Pending provider prerequisites and release gates

1. **Dedicated management Supabase Auth URL settings**: site URL and exact permitted redirect URL should point to the stable protected branch preview until dedicated management production domain approved. Current Supabase project initially defaulted localhost; app-side redirect was fixed; provider setting still needs verified configuration. Do not change student Auth URL settings.
2. **Email sender credentials in dedicated staff project only**: supply `RESEND_API_KEY`, `MEDNEST_STAFF_EMAIL_FROM` (verified sender), `MEDNEST_STAFF_EMAIL_PEPPER` (random >=32 chars) securely through Supabase Edge Function secrets. These are **not stored in GitHub or chat**. The app currently reports sender unconfigured. No test email sent in this task. Consider verified domain for professional production use; ensure deliverability. Must end-to-end test code expiry, retries, send throttle and 30-minute window with verified Chief before enabling operations.
3. Full safe Management Panel cutover remains separate: migrate old management staff settings to new staff-only schema, implement invitation/permissions in isolated project, mask private Chief email in ordinary staff API and logs, complete all negative authorization tests. **Keep staff invites disabled**, no uncontrolled student service-role bridge, no production main merge.
4. Destructive operations must call `mednest_staff_sensitive_authorized` in the exact transaction where the relevant records are modified; the existing gate alone does **not** protect future endpoints unless explicitly integrated. Add per-operation idempotent checkpointing and audit for future destructive jobs; no deletion endpoint was built in this batch.
5. Do not ask owner to create a new Chief account or repeat email verification: dedicated Chief account is already verified and activated, with profile audit confirmed in previous checkpoint.

References: [isolated architecture](SJN-MEDNEST-STAFF-AUTH-ISOLATION-ARCHITECTURE-2026-11-07.md), [Step 2 implementation handover](SJN-MEDNEST-MANAGEMENT-AUTH-STEP2-IMPLEMENTATION-HANDOVER-2026-11-07.md), Master Development Plan, Future Features Register and Release Safety Checklist.
