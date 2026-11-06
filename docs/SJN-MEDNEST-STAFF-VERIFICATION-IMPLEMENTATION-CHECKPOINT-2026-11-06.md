# SJN MedNest Management Panel — Staff-only Email Verification and Chief Admin Bootstrap

**Date:** 2026-11-06 Pakistan time  
**Status:** **Staging security implementation deployed; external email sender configuration required before actual verification email and first Chief Admin activation.**  
**Owner authorization:** "do it", after explicitly requiring management-only verification for every staff member and no change to student registration, student LMS experience, production, or Supabase's shared authentication settings.

## Delivered

- New staging Supabase Edge Function `mednest-staff-onboarding`, ACTIVE **version 2**. Versioned source: `database/management/mednest-staff-onboarding/index.ts`.
- Authenticated Management Panel login can now detect that a verified-Auth account lacks management membership, check onboarding eligibility through the protected service, and present a distinct **Verify Management Email** screen.
- Protected email-code delivery supports external **Resend** API only when its separate secure settings are present; sends an eight-digit one-time code to the authenticated approved user’s exact email, expires in 10 minutes, max five verification attempts per code, minimum 90 seconds between sends and up to five sends/day.
- Code hashes are server-side HMAC-SHA256 with a separate secret pepper. Neither raw code nor pepper are stored in database or source.
- New RLS-protected staging `mednest_management_email_challenges` database table, no direct student/anonymous reads/writes.
- New RLS-protected `mednest_management_bootstrap_approvals` table, exactly one **approved Auth UUID and email** recorded as pending initial Chief Admin. This is *not* an access grant.
- A service-role-only, transactionally atomic SQL verification function validates one-time code, its expiry, email matching the Auth identity, preapproved account UUID/email, unique Chief Admin and audit record. If any DB step fails, the transaction rolls back.
- Newly invited Management Team Members must pass the same email proof before their invitation becomes active when using the new onboarding route.
- No student Supabase Auth confirmation/SMTP/rate-limit changes, student UI or existing exam engine changes, LMS database schema edits, or production deployment. The new tables/functions are exclusively for management staging.

## Verification and deployment checkpoints

- Latest Management UI commit `9addfbc67f71682052f91fafd2a35921c28e5f02`, GitHub CI Foundation checks **SUCCESS** (two runs).
- Isolated Vercel Preview deployment **READY**: `dpl_Aiw98Sy1AFDXjg85QNcP9jDzCBtd`, **https://sjn-mednest-management-jp0gb1lu5-sjn1.vercel.app**. The Vercel project remains SSO-protected for all deployments.
- Latest revised staff-only Edge Function source commit `fd16f4f989a4c96c3d7474d2e73e1a49ea630046`. Only the Edge source and new management-specific database objects changed after the Vercel UI deployment; no UI re-deploy needed for the backend hotfix.
- Staging DB verified: one approved (pending) initial Auth identity, **zero management membership grants, zero email challenges, zero management audit events**.
- Direct privilege audit verified `authenticated` cannot read the approval table or execute privileged bootstrap function.
- User’s personal email was already registered in staging during prior steps. No new registration is required; avoid trying the first-time signup form again.

## EXTERNAL DEPENDENCY — requires user action; not silently solved

Resend sender cannot operate without:
1. User-managed Resend account and verified sending domain/sender accepted by Resend. See https://supabase.com/docs/guides/functions/examples/send-emails and https://resend.com/docs.
2. For **initial owner-only testing without an academy domain**, create a Resend account with the **same personally controlled email that is being verified**. The test sender `SJN MedNest <onboarding@resend.dev>` can deliver to the Resend account owner only (verify against Resend's current testing restrictions).
3. Configure the **one required secret** `RESEND_API_KEY` in staging Supabase Dashboard **Edge Functions → Secrets**. The code defaults to the Resend test sender and derives a domain-separated HMAC key from the protected Supabase service-role secret. Optional overrides for future academy email sender and independently provisioned pepper are `MEDNEST_STAFF_EMAIL_FROM` and `MEDNEST_STAFF_EMAIL_PEPPER`. **Do not share API credentials in chat or GitHub.**
4. After configuration, owner visits protected Management Panel → Sign In using existing personal email/password → Verify Management Email → Send Verification Code → privately enter code → configure authenticator MFA → access Chief Admin.
5. Test actual email arrival, provider send logs, approved-email match, wrong/expired OTP, resend throttling, unauthorized student login and no disruption to student LMS. Until complete, **do not claim Chief Admin activated or real staff onboarding successful**.

## Remaining technical gates

- **Staff invitations temporarily disabled securely** (server returns 503 instead of using default Supabase Auth email). Chief Admin can manage existing staff once active, but cannot send invitations until provider-backed invite delivery and credential setup are separately implemented and tested. This avoids impacting student email settings.
- **Resolved in subsequent staging backend update:** legacy invited-member activation after MFA alone was removed. All invited members must complete staff-specific email proof first. Backend `mednest-management` Edge Function version 5; source commit `c529ad5f4feb0af5cb6c29d125b405e40e178821`.
- The existing public-style first-time Chief Admin signup on Management Sign In can create another staging Auth identity; after initial setup, retire that UI and rely on Chief Admin-only invitations, keeping the student system unchanged.
- Transactionality of team.invite and team.update audit is still a documented technical debt item and should be hardened before rollout.
- Test migration/DB advisors, mobile visual QA and student performance before production.

**Do not change student global Auth email confirmation settings or enable shared SMTP to solve this; the owner explicitly forbids changes affecting Student LMS.**

**Cross-chat:** Official brand **SJN MedNest**, highest role **Chief Admin**, matching Auth UUID from approved personal account only; first staff-only verification is still pending email provider configuration. Every other Management Team Member requires independently verified email and MFA. Work on branch `sjn-phase1a-foundation`, no main/production change without explicit authorization.

## Verified remediation and next action

- Latest test source commit `1e63378e112d442a7a582aa9f8897007f75f31c0`; pending/check resulting CI before final certification.
- Resend supports testing the sender `onboarding@resend.dev` to **the Resend account owner's own registered address**, without a custom domain. A domain verified through Resend is required for emails to arbitrary staff recipients. The test sender can be used to activate the initial Chief Admin if the Resend account is opened with that same personal email. Do not use the sandbox sender to invite other team members.
- Current verification function is **fail-closed** with unconfigured Resend secrets. The user must independently create/configure a verified Resend account and place the API key and high-entropy pepper in Supabase **staging Edge Functions → Secrets**; never send keys/OTP/passwords in ChatGPT messages.
- Initial Chief Admin bootstrap references one exact **approved staging Auth UUID** recorded privately in protected database; it no longer relies solely on an email address embedded in public Edge source.

## Final simplified first-account setup

**Staging Edge Function `mednest-staff-onboarding` version 3, repo commit `1b2e0a640bf562f05c1ffb6083ed1f9ad718a043`:** Only `RESEND_API_KEY` is needed for an initial sender-only test when Resend is created with the approved email. The default sender is `SJN MedNest <onboarding@resend.dev>`; this is a temporary Resend-provided testing sender, **not an academy-owned sending domain**. OTP HMAC now uses a domain-separated secret derived from the already-protected Supabase service-role credential unless an independently generated pepper is configured. All keys remain server-side. After the first verified Chief Admin account is activated, a verified domain/sender and separate invitations must be implemented before sending any staff invitations. Student global Auth remains unchanged.

## 2026-11-06 — Chief Admin verified; MFA handshake defect fixed

- Verified in staging database that the approved account completed the dedicated email proof at 18:19:59 UTC, received the unique `chief_admin` membership with `active` status, and atomically wrote `chief.bootstrap` audit event. There is one completed email challenge. No additional account was created.
- User screenshot after success showed the Sign In shell and message **"Email ownership verified. Now complete authenticator security."** with no TOTP setup panel. Root cause in `database/management/mednest-edge-function/index.ts`: `aal2` MFA requirement was checked **before** the `me` handshake; hence `me` returned 403 at `aal1`, and browser incorrectly returned to staff-onboarding eligibility logic despite already being active.
- Fixed `me` handshake to return `mfa_required: true` for a verified active member at `aal1` **before** general `aal2` enforcement; all sensitive operations (team list/update, audit, invite) remain blocked until `aal2`. Invited/unverified members are still denied.
- Deployed staged **mednest-management Edge Function version 7**, commit `941f836450135ea3b33833891df57ce79ad7f90a`. Added regression test commit `dc3f555cbcf632976a3179d8d0fd9531ac54fb0e`. GitHub checks `42270482237` and `42270490393` both **SUCCESS**.
- Only management backend, tests and handover were changed; **student LMS and production untouched**. No new Vercel redeploy required: the existing management frontend requests the versioned backend at the same endpoint.
- Next user action: refresh existing protected management preview, continue with TOTP setup (QR or manual secret), verify authenticator code **only on management website**. No further email proof or signup. Confirm genuine `aal2` before signing off dashboard/teams. Never request codes/secrets/screenshots showing QR or setup secret in chat.
