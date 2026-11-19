# SJN MedNest Management Panel — Isolated Chief Auth integrated preview
**Date:** 2026-11-07 Asia/Karachi  
**Status:** Implemented, CI PASS, protected Vercel Preview READY. **Owner browser UAT pending. No production or old login cutover.**

## Approved scope
Owner authorized the next Step 2 batch: integrate the verified independently authenticated Chief Administrator into the **existing professional Management Panel**, without changing the public/student Academy LMS, preserving a rollback path and keeping sensitive staff mutations locked.

## Architecture and exact paths
- Current original professional Management Panel: `apps/management/index.html` + `apps/management/auth-client.js`. **Unchanged**. Its staged legacy Auth URL `aozknkrwafowsrehdwlr` and isolated management tables are preserved as rollback; don't promote old shared student authentication.
- **New parallel professional integration preview:** `apps/management/integrated-auth-preview.html`, loading **same original** `/styles.css`, `/app.js`, layout/theme/navigation/sections, but using dedicated `/auth-client-isolated.js` instead of the older client.
- `auth-client-isolated.js` uses dedicated staff Supabase Auth `tdqbjhrmfluiinntmjfh`, the previously verified Chief role and its separate session storage key `sjn-mednest-isolated-staff-v1`. The private Chief API `mednest-isolated-auth` verifies role and status server-side; only Chief may enter this integration preview. Initial sign-in continues simple email + password, and verified existing user session can be reused within same preview origin.
- Exact allowed API calls in this preview: `me` and `profile.update` through the isolated private Chief API, `team.list` and `audit.list` through the dedicated isolated read-only Team API. All other management mutation calls fail locally **and**, independently, the staged `mednest-isolated-team-actions` API remains `WRITES_ENABLED=false`.
- Chief own email is visible in **own My Profile only**; Chief identity card uses display name or generic protected title, not email. Team count **excludes Chief**, and activity display does not include actor UUID/email or raw metadata. Signed-out view scrubs prior profile email, identity, team and activity DOM content.
- Legacy invitation URL/screen/form is not reachable: the isolated JS discards `#invite` token fragments and registration/signup implementation is removed. Team invitations and permissions changes are hidden/disabled even if a sender status changes. Normal profile display name/title can be safely updated in separate management staff DB.
- Auth/staff read endpoints verify dedicated project issuer, active identity and session. The original `app.js` navigation still controls the full professional UI; non-built operation modules remain clearly marked as future.

## Verifications
- GitHub automated CI on integration commit `6e52fa7fdf6e5f01ed4b2df7c31115b3c295ed42`: **two successful Foundation workflows**. New test `tests/management-integrated-isolated-auth.test.js` checks old login untouched, protected Chief-only login/API routing, no invitation signup, no management writes, Chief email privacy and audit sanitization.
- The preliminary CI after removing dead signup code failed solely because an earlier test still expected the legacy function to exist. Corrected test now explicitly asserts the signup function is absent; both workflows passed.
- Protected Vercel development deployment `dpl_44Co2SEBDVYBsxztQrVJs6LeFCTL` **READY**, URL `https://sjn-mednest-management-9dn559mez-sjn1.vercel.app/integrated-auth-preview.html`. This is a protected branch preview, NOT main/production.
- No new Supabase schema/migrations, no student registration/Exam/History/Results modifications, no invitation email, no new staff account, no permission mutation, no paid-domain changes, no existing Management Panel switch.

## Mandatory owner browser UAT
1. Open `/integrated-auth-preview.html` on above URL. Sign in using **already verified independent Management Auth Chief credentials** (not first-time signup).
2. Verify same professional Management Panel interface, navigation, Auto/Dark/Light theme; Overview and **My Profile** reflect real Chief display name/title and own email; profile Save & refresh persists.
3. Navigate to **Team & Permissions**: Chief shown separately; ordinary Team Members 0, Pending Invitations 0; invitation button unavailable.
4. Navigate to **Reports & Activity**: sanitized events with date/action only, no email or actor ID.
5. Sign out and refresh; signed-out page shows no prior private staff data, and signing back in works.
6. Test mobile layout if practical. Report any blocker before approving old Management Panel cutover.

## Remaining gates
- Dedicated staff project email-domain sender, `RESEND_API_KEY`, `MEDNEST_STAFF_EMAIL_FROM`, `MEDNEST_STAFF_EMAIL_PEPPER`, Auth Site URL and permitted redirects still need verification. Code tests for 10-minute email OTP, 30-minute same-session staff sensitive authorization and delivery still pending; **zero sensitive action grant must be assumed**.
- Fully secure invitation acceptance, transactional resend/cancel idempotency, permissions, active/suspended/revoked staff tests and privacy negative tests prior to any enabled staff writes.
- After owner UAT, an **explicitly approved cutover** could update original `index.html` to the isolated staff session with rollback. Until then keep original `auth-client.js` and existing Vercel protected Preview unchanged; do not rename custom domain or touch student LMS.
- Once verified, next major Management Panel features: Question Content Studio, Courses & Sessions, Student Management, Feature & Enrollment Access and Reports. All require separate server-scoped student DB API work.

## References
`docs/SJN-MEDNEST-MANAGEMENT-STEP2-TEAM-ACTIONS-STAGING-2026-11-07.md` and `docs/SJN-MEDNEST-PRODUCT-AND-DOMAIN-ARCHITECTURE-DECISION-2026-11-07.md`. No separate student website domain, only main Academy + `admin.` Management Panel after domain purchase.
