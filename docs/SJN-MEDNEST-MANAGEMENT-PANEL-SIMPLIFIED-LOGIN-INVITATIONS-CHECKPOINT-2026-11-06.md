# SJN MedNest Management Panel — Approved Simplified Login and Staff Invitations

**Date:** November 6, 2026 (Asia/Karachi)  
**User approval:** User explicitly approved (a) normal Management Panel login with **email and password, no QR/TOTP**; (b) extra emailed security code when the Chief Admin performs sensitive staff actions; (c) **Chief Admin-only** email invitations for other members, each with independent permissions, optional display names/nicknames and optional organizational titles. User repeatedly insists: **the existing Student LMS and its registration experience must not be altered.**

## Development and staging status

- Repository `sumairniz/SJN-MDCAT-LMS`, branch `sjn-phase1a-foundation`.
- Last code/test commit before this handover: `b9bdb8ce320c609c2d1bfb0bd0c8ac9ffb1f315f`.
- **GitHub Foundation checks SUCCESS**: `42277073994`, `42277080709`. Management browser JS/Edge Functions also manually syntax-validated.
- **Isolated Management Panel Vercel Preview READY**: deployment `dpl_ERjkFw9Yg3GEEW2JXevoFWgZWabk`, URL `https://sjn-mednest-management-6lxgbgzgn-sjn1.vercel.app`; project `sjn-mednest-management` (`prj_Uhb73zzfpQjXxqa5bitk8jrp4uU2`), team `team_AOaL10r6OwIXpIy4XlO8DmSH`. **SSO protection is enabled for all Management Panel deployments**.
- Staging Supabase Auth + Management-only tables: project ref `aozknkrwafowsrehdwlr`, separate from the old production project. One preapproved/verified, active `chief_admin` account exists. No staff invitations or new staff identities created during this milestone.
- Supabase `mednest-management` edge function version **10** (signed-in staff profile, team directory, audit, sensitive-action checks, invitation scheme gated).
- Supabase `mednest-management-stepup` edge function version **1** (password-session-bound email code send/verify). The previously used `mednest-staff-onboarding` function is separate and does not grant access to new arbitrary accounts.

## Completed: normal staff login

- `apps/management/auth-client.js` uses only public Supabase publishable key and Supabase Auth `signInWithPassword`, then a server-checked `me` response proving a currently active management membership. **No TOTP or QR flow is invoked.**
- Management-only Sign In and workspace, dark/light/Auto themes preserved. The existing Chief Admin can attempt password login now; real manual login acceptance test still needs user's confirmation.
- Team Members (when separately provisioned later) will use their own credentials and only server-assigned capabilities.

## Completed: email security for sensitive actions

- New staging `public.mednest_management_stepup` with RLS on and no `anon`/`authenticated` access. The server validates JWT with `auth.getUser`, active `chief_admin` membership and Supabase Auth `session_id`. Code is an eight-digit cryptographically random value hashed with a domain-separated HMAC key based on the secure server secret or optional custom pepper. Never sent to frontend except through the member's registered email.
- Resend used as a **management-only** email delivery service. The sender defaults to Resend's testing address when `MEDNEST_STAFF_EMAIL_FROM` is unset, allowing owner email only where Resend permits. The owner previously added `RESEND_API_KEY` to staging Edge Secrets. No student SMTP or Auth confirmation setting changed.
- Database functions `mednest_reserve_management_stepup` and `mednest_verify_management_stepup` enforce limits: 10-minute code, max five attempts, 90-second resend delay, max five emails/day, session binding, and ten-minute post-verification sensitive-action window.
- Sensitive team actions are checked both in the API **and** in transactional database RPC functions (`mednest_create_management_invitation`, `mednest_update_member_with_email_stepup`, `mednest_revoke_management_invitation`) and audited.
- A **Test Email Security Verification** button is now provided to the Chief Admin in **Team & Permissions**, so it can be tested without inviting a new person.
- Existing verified account has no need to repeat signup or mailbox ownership verification just to sign in.

## Staff invitations: approved design implemented but intentionally DISABLED for new people

The full design and source are present:
1. Chief Admin selects **Invite Management Team Member**, enters the target email, optional display name/title and individually granted technical permissions.
2. Chief Admin confirms a recent email security code.
3. Backend creates a 256-bit single-use invitation token, stores **only SHA-256 hash**, expiry 72 hours, and sends the invitation with Resend from a **verified academy sender domain**.
4. Invitee opens a personal URL fragment link, creates a personal password (or signs into a matching existing account), and the server atomically checks exact invited email and unused/unexpired token. Staff membership is created as ordinary `member` with the Chief Admin's selected permissions and an audit event. Chief Admin can see and revoke pending invitations and change/suspend members. No self-promotion or Chief Admin peer accounts.
5. Both email verification and member authorization are independently checked server-side.

**BUT: DO NOT ENABLE CURRENTLY.** A final architecture audit found that the staging Supabase Auth project's `auth.users` table has an existing **`on_auth_user_created` trigger** calling `public.handle_new_user()`; inspecting its body confirmed it **automatically inserts into `public.profiles` with `role='student'` for every newly created Supabase Auth user**. Thus, creating new staff signups through this shared staging Auth would silently create student profiles. The owner explicitly forbids any change/side effect to student registration and data.

**Safety remediation already deployed:** `STAFF_IDENTITY_ISOLATED=false` gates `team.invite`, `invite.preview`, and `invite.accept` at the protected API. The UI **disables the Invite Member button** and explains that staff onboarding is paused until separate identity management is available. No new staff accounts/invitations were created. Do not casually flip this flag without having a real isolated identity solution and end-to-end testing.

A distinct management identity service/Auth project is the recommended next architectural milestone. Creating a new Supabase project can have costs/limits, which need independent owner review and explicit consent. Do not delete/alter the Student LMS trigger, production, or student tables as a workaround. A separate verified academy email sending domain must also be configured before emailing invitations to arbitrary staff; the Resend test sender only serves limited own-address testing.

## Verification and constraints

- Staff count = 1 (sole active Chief Admin); invites = 0; step-up records = 0 at migration inspection.
- RLS enabled/no direct `anon`/`authenticated` table SELECT on `mednest_management_invitations` and `mednest_management_stepup`; direct client EXECUTE on invite-accept and mutation RPCs revoked. Security advisors show INFO lint `rls_enabled_no_policy` on management-only tables (deliberate server-only deny default); no new management security-definer function exposed to authenticated users. Other unrelated student RPC and leaked-password lint findings were not modified.
- No changes to `public/`, `server.js`, student Auth signup trigger, student tables, student analytics/tests, `main`, student production or production DB.
- GitHub tests and Vercel `READY` are not a live account/password test. User should open protected preview and sign in using existing Chief Admin email/password; confirm dashboard. On Team page test **Test Email Security Verification** and enter emailed code privately; do not share codes/links/secrets in ChatGPT.
- Sensitive email security for Chief Admin, while safer than password-only sensitive changes, is less phishing-resistant than authenticator-based MFA; user approved this trade-off. No QR/TOTP should be reintroduced without fresh user approval.

## Prior docs superseded

Historical `docs/SJN-MEDNEST-MANAGEMENT-PANEL-PHASE1A-AUTH-FOUNDATION-HANDOVER-2026-11-06.md` and earlier staff-only verification handover document the old MFA2 requirement, which is **superseded** by this owner-approved simplified-login checkpoint. Keep historic docs for traceability; this file controls future work.

**Next actions:** (1) Owner tests password-only Chief Admin login and email security. (2) Review cost/identity provider for isolated staff identities. (3) Configure verified sender and safely enable end-to-end staff invitations and revoke/status workflows. (4) Measure student LMS performance and obtain separate approval for broader Management modules or production release.
