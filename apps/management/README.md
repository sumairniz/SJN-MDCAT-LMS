# SJN MedNest Management Panel — Phase 1A staging authentication foundation

**Source:** `apps/management/` on `sjn-phase1a-foundation`. This is a separate Vercel project, not the student LMS.

## Implemented
- Branded responsive staff Sign In using staging Supabase Auth (email and password).
- Required TOTP authenticator enrollment/challenge before any privileged operation.
- Server-verified session and **deny-by-default staff membership** in `public.mednest_management_members` (not student `profiles.role`).
- `database/management/mednest-edge-function/index.ts` versioned staging Edge Function (no service-role key in static frontend). Checks verified JWT, confirmed email, authoritative membership, token AAL, Chief Admin-only team invitations/permission updates, permissioned audit history.
- Management-team listing and role/permission editor for Chief Admin, with individual capability controls; staff self-profile displays technical role/actual granted rights independently of nickname and organizational title.
- Audit log of staff-sensitive management actions, separate `public.mednest_management_audit` table, with Row Level Security, no direct anon/authenticated access.
- Full light/dark/auto appearance system persists, still management-only.

## Crucial safety gates
**No Chief Admin account has been assigned.** The staging staff table initially has zero rows and an index ensuring no more than one Chief Admin. Real entry requires **explicitly confirmed verified Auth UID/email** and a safely audited bootstrap procedure; do not guess from existing student accounts, academy name, or ChatGPT profile. Until then, ordinary students are rejected even if they can authenticate.

- Auth for staff uses a **separate browser storage key**, but the same staging Supabase Auth identity system. Session storage contains OAuth tokens; do not treat localStorage as a permission source. The staff service re-checks current membership on every privileged call.
- Supabase Edge Function is deployed with `verify_jwt=false` because the function itself checks `srv.auth.getUser(jwt)` and enforces staff roles, email confirmation, AAL2 and Origin allowlist. **Never remove those checks.** Unverified requests must remain denied.
- Browser code contains only the Supabase **publishable key**; no backend service key. Management API uses service_role only in Supabase-hosted runtime.
- No current student LMS code, RLS policy on existing tables, student exam or main production was changed.
- The Edge Function is functional but cannot be end-to-end tested with a real staff account until Chief Admin bootstrap; browser visual acceptance and authenticated invitation/role tests are pending.
- The current system does not provide actual MCQ editing, course editing, whole-feature premium rules, student data, or other operational modules. These are later phases and remain placeholders.

## Recommended next step
Confirm the specific existing staging Supabase Auth account UUID and verified email that should be elevated to Chief Admin, using a user-controlled identity confirmation workflow. Apply a single tightly reviewed bootstrap on staging only, then enroll TOTP, validate login/member roster, test revoke/suspend/role boundaries and audit, and perform student performance regression tests before declaring Phase 1A complete.

**Security follow-ups:** adopt transactional audit writes for member mutation, carefully review browser-local session storage and invite recovery policies, verify Auth redirect URL/invitation configuration, disable/limit Vercel default alias and verify activity logs under adverse conditions. Do not release staff operations to production without these gates.
