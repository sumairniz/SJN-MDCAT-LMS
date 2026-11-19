# SJN MedNest — Step 2 staff action service pre-release checkpoint
Date: 2026-11-07 (Asia/Karachi). Branch: `sjn-phase1a-foundation`.

## Current state
Owner asked what to check in the protected Management Auth preview and to proceed with the next step. The exact checks are: existing Chief signs in, Team & Permissions shows 1 Chief / 0 team members / 0 pending invitations, and the Email Security section displays whether the independently configured sender is ready. No repeat signup required.

A direct read-only Supabase check at the time of this change returned **1 active Chief, 0 email step-up challenge rows, 0 verified step-up audit events and 0 invitations**. Thus account verification is known, but *sensitive-action code verification and live email delivery are not yet independently proven*.

## Implementation
New `database/management/mednest-isolated-team-actions/index.ts` is deployed as dedicated Supabase project `tdqbjhrmfluiinntmjfh` Edge Function `mednest-isolated-team-actions` v1 with JWT gateway verification on. Its implemented code contains validation for eventual invitations, updates, invitation cancellation and acceptance, encrypted/token-hash matching, Chief-only actor authorization, signed-in session checks, and backend RPC guards. Crucially `const WRITES_ENABLED=false` prevents **all staff mutations and invitation acceptance** at the API entry point. Only authenticated Chief `capabilities` check is available; no invitation email was sent, no staff account created and no team permission was changed.

A new `tests/management-isolated-team-actions.test.js` checks the fail-closed constant, dedicated Supabase project identity, no student dependencies, and existing sensitive-operation RPC gates. Neither student staging Supabase `aozknkrwafowsrehdwlr` nor the older student project was changed. Current `apps/management/index.html` and original authenticated Management Panel continue using original staging Auth until migration/UAT, and the separate protected isolated preview remains the place to review Chief identity and read-only Team.

## Pending requirements before any live staff invitation
1. In the **management-only** Supabase Edge Function secrets, securely configure a verified sender and credentials, e.g. `RESEND_API_KEY`, `MEDNEST_STAFF_EMAIL_FROM`, and a randomly generated `MEDNEST_STAFF_EMAIL_PEPPER` (>=32 characters). Do not put any of these secrets into chat, screenshots, repositories or frontend code. Confirm custom domain verification and provider cost/quotas separately. The ChatGPT Supabase connector does not expose writing project Edge secrets or Auth URL settings.
2. Independently test an 8-digit email code delivered to the verified Chief's mailbox, consumed before 10-minute expiry; test wrong code rate limit, same-session 30-minute window, expiry, and revalidation. Verify `security.stepup_verified` audit event.
3. Before changing the hard-disable gate, fix and review invitation acceptance and delivery state machine: intended recipient must be able to inspect invitation without Chief role; only a genuinely confirmed, invitation-matching new Auth identity can redeem once; email failures must not leave a silently enabled invitation; review resend, duplicate requests, rate limits, idempotency and domain allowlists. No blanket public API permission for staff tables. Add full owner browser UAT with test-only invited address, revocation, suspension, role and Chief-email redaction.
4. Integrate staff session bridge into existing Management Panel with tested rollback; do not change student account registration or historical exams. Explicit owner sign-off required before any production/main release.

Source prior: `docs/SJN-MEDNEST-MANAGEMENT-STEP2-TEAM-ISOLATION-HANDOVER-2026-11-07.md`.

**Release status: incomplete/disabled by design.** Successfully deployed staging scaffolding is *not* a live invitation feature.
