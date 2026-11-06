# SJN MedNest Management — Step 2 Isolated Staff Auth Implementation Checkpoint

**Date:** 2026-11-07 Asia/Karachi  
**Owner authorization:** “Implement Step 2 now” after approving the $0/month separate staff project and no-compromise speed/performance principles.  
**Status:** **Dedicated foundation IMPLEMENTED AND AUTOMATED-VERIFIED. Chief Administrator new-project identity NOT YET CLAIMED; credentialed owner browser testing and cutover pending.** **Do not call staff invitations live.**

## Projects and isolation

- New, dedicated **SJN MedNest Management Auth** Supabase project `tdqbjhrmfluiinntmjfh`, region `ap-south-1`, `ACTIVE_HEALTHY`, previously quoted $0/month Free.
- Student staging project **unchanged** `aozknkrwafowsrehdwlr`. Old paused legacy project **unchanged** `yapvnevvjfewvafbjcgc`. No student schema or student Auth setting, exam engine, History/Results, quiz timing, MCQ bank, payments, main/production Git or Vercel application changed.
- The protected Management Panel Vercel project `sjn-mednest-management` continues to serve the **original** existing login at `/index.html`; **new independent bootstrap/login test page only** at `/isolated-auth-preview.html`. Original login frontend `apps/management/auth-client.js` is unchanged; only Management Panel CSP now also permits new staff Supabase host.
- Existing sole Chief Administrator's **already verified personal email fingerprint** (SHA-256 of normalized email, no plain email in repo or this document) was derived via a restricted verified Auth/management-member join from student staging and seeded privately in the new staff project's server-only bootstrap allowlist; no Auth user/password was copied. Fingerprints should be treated as private account metadata, not proof by themselves. New Auth email ownership verification is still separately required.

## Implemented code and database

1. `database/management/isolated-staff-auth-foundation.sql`: dedicated staff membership table, verified-email single-Chief bootstrap allowlist, minimal non-PII audit events, one-Chief unique index, live Auth session RPC, service-role-only atomic Chief claim, self-profile update RPC; all RLS enabled and no browser direct table/RPC grants. Auth FKs reference **new dedicated** `auth.users`, never student Auth. Applied as migration `mednest_isolated_staff_auth_foundation_20261107` in the **new project only**.
2. `database/management/isolated-staff-audit-fk-indexes.sql`: two audit foreign-key performance indexes; applied as `mednest_staff_audit_fk_indexes_20261107` in new project only. Unused new index INFO note can remain until actual traffic.
3. `database/management/mednest-isolated-auth/index.ts`: deployed **ACTIVE version 1**, `verify_jwt=true`. Allowed origin is the isolated Management Panel Vercel hostname pattern. Every request validates Auth-project issuer/audience, signed token by `auth.getUser`, confirmed email, matching subject, live server-side session and active Chief membership. Only `me` and `profile.update` endpoints exist; Chief email is returned **only to the signed-in Chief's own profile**. No team list, audit list, invitations, premium access, student read/write, or other staff privileges.
4. `apps/management/isolated-auth-preview.{html,js,css}`: standalone, responsive owner-testing preview with independent storage key; single-use new-project signup, sign-in, Chief-own profile update and signout. Visible link back to the unchanged existing Management Panel. Existing standard student site untouched.
5. `apps/management/vercel.json`: add new management Auth host to management-only CSP connect-src while retaining the existing host and SSO protection. **No changes to student CSP**.
6. `tests/management-isolated-auth.test.js`: negative/source tests for two-project separation, unchanged old management login, no student write endpoints, unique Chief, RLS and service-role-only RPCs, own-email-only response, issuer/session guard, new preview and CSP.

## Verification (not to confuse with owner browser UAT)

- New Supabase project SQL: membership=0; bootstrap_allowlist=1; bootstrap claimed=0; audit=0; auth.users=0 at end of implementation. This is **intentional** until the owner signs up the separate account; no Chief exists there yet.
- New project has **no student profile creation trigger**. All 3 sensitive staff tables: RLS enabled, `anon` and `authenticated` cannot SELECT. All 3 privileged RPCs: `anon` and `authenticated` cannot EXECUTE, `service_role` can execute.
- Rollback-only negative test for an unknown Auth UUID returns `email_unverified` and leaves no membership/audit data. Project contains no new student Auth user. Security advisor flags `rls_enabled_no_policy` **INFO by design** (server-only deny default), not an invitation to add a public policy. Performance advisor initially flagged two new unindexed audit FKs; migration added both indexes.
- Initial CI run for test addition failed due an **invalid test regex**, not product implementation; corrected test source `727524fd6da199ab9bc53ded52676a7d8601826d`, both CI successful. Final isolated code + index commit `286b999442d2244955e7514839ebaa0e4c6a9e05`, **two Foundation workflows SUCCESS**.
- Protected Vercel **Preview** `dpl_93MheDZU4ewishsz6qCTebWKyWa2` **READY**, commit `286b999442d2244955e7514839ebaa0e4c6a9e05`, URL `https://sjn-mednest-management-pnihwud5b-sjn1.vercel.app/isolated-auth-preview.html`. Verified that Vercel project SSO protection is **enabled for all deployments**. Not production/main student release.
- No owner browser sign-in, email delivery, independent user creation or successfully claimed new Chief privileges has been verified. No staff invitations or new email security flow has yet been built in the new project. **Existing Chief login and 30-minute sensitive-email authorization in the original Management Panel remain unchanged.**

## Immediate next action: one-time new-project Chief identity setup

1. Owner opens the **protected isolated-auth-preview.html** above and signs in through Vercel protection as usual. It is not a replacement for the existing Management Panel.
2. Using the **same previously verified Chief Administrator email** (never post it in chat), owner chooses **One-time new-project account setup**, sets a **new private password at least 12 chars**, then follows the Supabase email confirmation, if sent. New Supabase project's default email delivery and redirect URLs have not yet been manually end-to-end verified; if confirmation links navigate elsewhere, return to the protected preview and use Sign In after confirming. Do not change student Auth settings or ask for secrets/passwords/codes.
3. After verified login, `me` automatically and atomically claims the **single** Chief Administrator role **only** if new project's Auth identity matches the privately seeded approved email fingerprint and email confirmation is set. Owner confirms My Profile, Save Profile, refresh, sign out/in from new-project preview. If sign-up succeeds but no verification email arrives, investigate **only** new staff project's email delivery and Auth redirect configuration.
4. Once owner confirms, separately scope the controlled migration of remaining management member permission/audit/step-up architecture from old staging Auth to the new project, maintain rollback and no role/data loss, and implement a new management-only 10-minute code / 30-minute verified staff-sensitive session window. Existing original login continues until a verified cutover and owner approval.
5. **Invitations stay disabled** until dedicated staff Auth, verified sending domain, Chief-only per-member permissions, atomic invite acceptance/revocation/audit, email privacy redaction and negative authorization tests are complete. No staff cross-project student data access before separate approval.

## Previous plan and release safeguards

Refer to `docs/SJN-MEDNEST-STAFF-AUTH-ISOLATION-ARCHITECTURE-2026-11-07.md`, `docs/SJN-MEDNEST-MANAGEMENT-PANEL-PROFILE-TEAM-REFINEMENT-AND-STAFF-AUTH-PLAN-2026-11-07.md`, Master Development Plan, Future/Deferred Register, Temporary Change Register, Release Safety Checklist. Full production remains separately gated; no successful CI proves credentialed owner sign-in or student load-test performance.
