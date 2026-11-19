# SJN MedNest Management Panel — Chief Administrator Profile and Team UI Refinement

**Checkpoint date:** 2026-11-07 (Pakistan).  
**Scope approved:** User reviewed a short Management Panel screen recording and explicitly approved improving the current signed-in profile, separating protected Chief Administrator from ordinary staff directory, grouping management permissions, removing the standalone test-security button, preserving student experience, and preparing isolated future staff Auth architecture.

## Completed (staging Management Panel only)

- **Actual signed-in profile**: The authenticated member's `me` result always populates My Profile, showing verified email, role, account state, and effective technical permissions. The protected technical role code remains `chief_admin`, with the approved formal display label **Chief Administrator**. No arbitrary personal name has been invented. Name is shown only if present in the protected management record.
- **Chief Administrator self-display settings**: A specific, server-only, audited procedure `public.mednest_update_chief_own_profile` allows the active Chief Administrator to save their **own optional display name and organizational title**, without changing email, technical role, privileged permissions, or account state. Granted through the server `profile.update` action; no anonymous/client direct RPC grant. Ordinary Team Members cannot use the Chief Administrator self-edit action; their names/titles remain assigned by the Chief Administrator.
- **Team directory**: Protected Chief Administrator shown in a separate identity card (including a link to My Profile); ordinary **Management Team Members** alone are counted in the team KPIs and ordinary member list. No Chief Administrator row redundantly appears in that list.
- **Grouped permissions**: Team invitation and edit forms display compact accessible native 16px checkboxes under **Academic Content**, **Courses & Resources**, **Students & Enrollment**, **Reports & Operations**, with supporting text and responsive light/dark styling. This fixes the oversized checkbox issue visible in the recording.
- **Removed temporary standalone Test Email Security Verification button** from Team & Permissions. Actual sensitive operations still trigger separate 8-digit email step-up automatically. No QR/TOTP requirement has returned.
- **Sidebar and header**: renamed generic `Member Profile` to **My Profile**, improved personal avatar label and removed outdated example-profile wording.
- **Retained security and UI**: Management Panel theme choices (Auto, Dark, Light), separate protected preview, staging-only staff email proof, staff access checks, Chief Admin-only permission mutations and activity audit.
- **No student modifications** to `server.js`, `public/`, `auth.users` trigger, `public.profiles`, exams, student analytics, production/main, existing Supabase student signup policy.

## Verified

- Repo `sumairniz/SJN-MDCAT-LMS`, branch `sjn-phase1a-foundation`.
- UI code/tests commit **`cf0de711854129ef1bac7ecbdfd018283bdaacc4`**; CI runs `42282318687`, `42282310035`, both **SUCCESS**.
- Protected Management Panel Vercel Preview **READY**: deployment `dpl_8uhoRuz7w1k81D7voAgKxKdVfa1S`, URL **https://sjn-mednest-management-5kphqv5f9-sjn1.vercel.app**; SSO protection still enabled.
- Staging `mednest-management` function version **11**, with role-checked `profile.update`. The profile-only DB function and audit operate in existing staging management schema.
- Browser syntax check passed with top-level await, `app.js` and `theme.js` syntax passed; HTML had **no duplicate IDs** and client DOM ID lookups had **no missing elements**. Tests cover Chief Administrator role display, directory filtering, permission grouping, protected profile edit and removal of test-only button.
- These checks do **not** replace an authenticated browser walkthrough with the owner. Have owner check My Profile and Team & Permissions in the updated protected preview.

## IMPORTANT: isolated staff-auth project remains a separate approval-dependent action

Existing staging Supabase `auth.users` has a trigger creating `public.profiles` `role=student` for every new Auth user. Do **not** modify that trigger or enable new staff accounts in that shared student Auth project. The staff invitation endpoints remain fail-closed (`STAFF_IDENTITY_ISOLATED=false`) and invitation control disabled. The previously approved **Chief Admin-only invitation workflow** is still the intended final model but cannot yet safely onboard other people.

Recommendation: create or select a **separate Management Auth identity project**, with independently managed staff identities and secure backend verification bridging to management operations. Do not simply swap Supabase URLs: current management membership and step-up logic reference existing Auth IDs and current server-issued session IDs. Carefully design migration/dual-read/cutover, retain one Chief Administrator, and test issuer/audience, session revocation, guest denies, safe member invitation, and real email delivery. Use a verified academy sender domain in Resend for arbitrary staff recipients; its development testing sender serves only limited own-address delivery.

Official Supabase docs say Free has an allowance of two active projects, but organization-level limits and cost must be confirmed before creating any new resource. Existing connected account inventory showed one active staging project and one inactive older project, both in Supabase org `SJN MDCAT LMS`. **No new project was created**, no old project deleted/reactivated, and no paid subscription or billing change authorized. The tool creating new Supabase project requires the organization ID explicitly provided by the user and a cost check/acknowledgement. Obtain them before resource creation.

**Sequence next:** Owner confirms updated visual QA; review organization/cost for isolated staff Auth project; when approved, create and wire the staff Auth project with migration strategy; configure verified invitation sender and complete end-to-end staff invitation/member permissions tests; then move to priority Question Content Studio and other approved Management Panel modules.

Read this document alongside `docs/SJN-MEDNEST-MANAGEMENT-PANEL-SIMPLIFIED-LOGIN-INVITATIONS-CHECKPOINT-2026-11-06.md` and official `docs/SJN-LMS-MASTER-DEVELOPMENT-PLAN.md`. Current implemented state supersedes historical TOTP/QR and example-profile notes.

## November 7 — Follow-up bug fix: profile save and sensitive security window

- User reported **Profile update denied** after entering intended name/title, and explicitly approved fixing it and extending email approval for staff-sensitive changes to 30 minutes. Production and student systems remain excluded.
- Root cause: PL/pgSQL function declared `current_role` to hold the staff technical role, but `CURRENT_ROLE` is PostgreSQL's built-in session-role expression. This returned a database role rather than `chief_admin`, causing the protected RPC to report `denied`. Renamed variable to `v_staff_role`, preserving active-Chief-only member predicate and service-only execution. The staff member's protected role code and unique privilege protections were not altered.
- Applied staging migration `mednest_fix_chief_profile_and_30_minute_security_window`; profile RPC now reports **updated** under an explicit rollback-only test and left **no persisted sample name, sample title or audit entry**. Protected account still active with existing empty self-profile settings pending the owner's Save.
- The email step-up verification code remains valid for 10 minutes and has rate/attempt controls; after verification, only sensitive staff-access changes are authorized for **30 minutes in the same authentication session**. No OTP required for normal login, own name/title, academic work, or routine student tasks.
- Updated email security Edge Function `mednest-management-stepup` to return accurate 30-minute wording, Management Panel UI and regression tests. No global Supabase Auth settings changed. Student LMS/production untouched.
- The preexisting protected preview will need to be refreshed after deployment for updated wording. Role-based authorization is always server-side.
