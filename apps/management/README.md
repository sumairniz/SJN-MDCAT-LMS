# SJN MedNest Management Panel — Staff Authentication & Team Access

**Owner-approved development milestone:** password-based staff Sign In, Chief Admin invitations and per-member technical permissions, email verification for onboarding, and email security approval for high-impact staff changes.  
**Deployment:** independent protected Vercel Management Panel project, root `apps/management/`, branch `sjn-phase1a-foundation`.

## Implemented and usable

- **Chief Admin:** first account has been created, mailbox ownership independently verified with the management-only Resend verification flow, and the uniquely protected `chief_admin` technical membership activated and audited. The owner signs in with the account's **existing email and password**. No QR scan, authenticator app or mandatory MFA challenge for ordinary login.
- **Member Profile:** verified email, active role, effective permission codes, optional display name/nickname and organizational title. Organizational titles cannot grant permissions.
- **Chief Admin email security verification:** a short-lived **eight-digit email code** (10-minute TTL, five attempts per challenge, 90-second resend delay, five sends/day), bound to the exact Supabase Auth `session_id`. Successful verification permits sensitive staff changes for **10 minutes** in that session. The frontend includes a **Test Email Security Verification** control on the Team page, so the owner can verify delivery independently of invitations.
- **Server authority:** all management operations verify the signed-in Supabase JWT with Supabase Auth and re-read the separate management-only membership table; technical roles and permissions cannot be set by client metadata. Ordinary staff cannot invite, suspend or change permissions.
- **Team directory and pending invitations** displayed only to Chief Admin. Atomic server RPCs have been implemented for pending invite record creation, acceptance, revocation, and changes to member status/technical permissions, with activity auditing.
- **Full Auto, Dark and Light modes** retained across the complete Management Panel.
- **Staff mail security isolated from Student LMS:** all management security messages go through the `mednest-management-stepup` Supabase Edge Function + Resend. No global Auth SMTP/confirmation rules were changed.

## IMPORTANT security gate: staff invitations are intentionally paused

**The existing staging Supabase Auth project has an `on_auth_user_created` trigger that inserts a `public.profiles` student record for every new Auth user.** This was confirmed by inspecting the trigger's actual definition. Creating a new staff login through the shared staging Auth `signUp` would therefore create a student profile and violate the explicit owner requirement that Student LMS and student data remain untouched.

Until new management identities are isolated from this trigger, the backend **refuses all invite creation, invitation preview and acceptance**, even if a verified sender is present. The **Invite Team Member** button is disabled with an explanatory message. This is a deliberate fail-closed control, not a completed staff-invitation rollout. Do not bypass it or ask staff to register on Student LMS.

**Next decision to implement safely:** use an entirely separate management identity provider/Auth project (requiring account/organization setup and possibly cost review), rather than changing the Student LMS trigger or global Auth configuration. Once isolated, enable the existing invitation workflow, test real email delivery, member password setup, invitation acceptance, revocation and permissions. An academy verified sender domain is also required to send invitations to arbitrary team members; the present Resend test sender only supports messages to its account owner's address.

## Source

- `apps/management/index.html`: Management Sign In, invitation acceptance design, active Team & Permissions controls, email-step-up dialog and staff profile.
- `apps/management/auth-client.js`: Auth UI using Supabase **public publishable key**, no service key and no trusted client-side permission flags.
- `database/management/mednest-edge-function/index.ts`: server-verified login, protected membership, Team Management, invitation workflow (gated) and audit.
- `database/management/mednest-management-stepup/index.ts`: email security-code send/verify, authenticated + session-bound + Chief Admin-controlled.
- `database/management/mednest-staff-onboarding/index.ts`: initial management-only ownership proof, used for the original Chief Admin activation; NOT a public staff registration endpoint.
- Supabase staging migration history: `mednest_invitation_and_session_bound_staff_email_stepup` and `mednest_atomic_staff_actions_require_email_stepup`, plus preceding staff authorization and verified Chief Admin migrations.
- `tests/management-step2-isolation.test.js`: static regression tests for branding, access control source guards, invitation/session rules, no QR and no student code imports.
- Development checkpoint: `docs/SJN-MEDNEST-STAFF-VERIFICATION-IMPLEMENTATION-CHECKPOINT-2026-11-06.md`.

## Boundaries and verification

**No changes to the Student LMS source, student Auth signup trigger, student tables, test engine, grading, analytics or production.** All management tables are RLS-protected, with no direct `anon`/`authenticated` CRUD. Backend service role is restricted to Supabase runtime, not a public browser bundle.

Automated GitHub checks and staging database privilege checks are necessary but **not** end-to-end login acceptance tests; the owner must confirm password login and session-bound email security code from the protected preview. Invite acceptance is deliberately blocked until the management identities are isolated.

For future implementations: never re-enable the public initial Chief Admin signup or TOTP/QR requirement. Chief Admin-only staff invitations, individual verified account identity, permissions and separate titles are **approved design**, but not yet permitted to create new staff in this shared staging Auth configuration.
