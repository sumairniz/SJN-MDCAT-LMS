# SJN MedNest Management Panel — Chief Admin, Light/Dark Theme, Profile Preview Handover

**Date:** 2026-11-06 (Pakistan time)  
**Owner authorization:** Explicitly approved the latest recommendations and requested implementation **in the isolated Management Panel development preview**. The owner additionally required each management member's own detailed profile to show their role and granted permissions.

## Approved permanent product rules

1. Official management app brand: **SJN MedNest Management Panel**, case-sensitive product name **MedNest** (allowed uppercase **MEDNEST**). Do not rename student LMS branding absent separate approval.
2. Highest technical staff role: **Chief Admin**, not Super Admin/Owner as the user-visible role. It inherits the full protected control previously planned for the sole Owner/Super Admin: exclusive staff membership and privilege management, cannot be demoted/revoked/self-elevated by regular team members. **CEO / Founder / Academic Director** etc. remain optional personal **organizational titles**, not technical permission roles.
3. Shared staff sign-in text: left-side title **Academy Management Workspace** under SJN MedNest branding; centralized, neutral description (no “your academy/team” directed exclusively to the founder). Tag **ACADEMY MANAGEMENT WORKSPACE**, authorization label **AUTHORIZED STAFF ACCESS**; email label **Email Address**. Dashboard keeps **Academy Overview** with generic management description.
4. **Light and Dark appearances are mandatory from the start** of the Management Panel, not a postponed student LMS feature. Both themes must cover the entire sign-in, dashboard, sidebar, cards, form inputs, text, states and profile panels with sufficient contrast. A third **Auto/System** option follows the device OS preference and is the default. Appearance controls on **both the sign-in page and dashboard header** apply to one synchronized choice, remember manual choices on return and respond to OS theme changes while Auto is chosen.
5. **Detailed member profile:** show verified identity and account status, effective technical role, explicit permission categories and action details, optional display name/nickname and optional organizational title. A member should be able to inspect their **own** granted permissions; Chief Admin can later manage other accounts and privileges, and the audit actor must always be the verified identity, not a chosen nickname. Display names/titles must never elevate access.
6. Team page metrics should count actual verified membership; do not invent students/members or depict sample access as live.
7. Keep existing student LMS and its styles/scripts/Supabase/production untouched; management performance overhead on the student LMS remains a release blocker. Future staff domain is **admin.<academy-domain>**.

## Delivered implementation (visual-only development scope)

**Repository** `sumairniz/SJN-MDCAT-LMS` • branch `sjn-phase1a-foundation`

**Final QA-fixed commit:** **`dded64033737b6e03006cc116d1cff725b157d96`** (previous implementation commit `128f3ad2b6f2584f5392f8c65d203f54f129c6dd`; the next two test-only commits corrected test assumptions).  
**GitHub Foundation CI:** Run `42195535240`, **SUCCESS**; original first run had a test assertion mismatch (matched full HTML attributes instead of option values) and was corrected before final release.
**New management-only Vercel deployment:** `dpl_Duq162aZ2ZceYCKhJpo4Aeu7AKgT`, **READY**, target **Preview**, built from exact SHA above, in protected existing project `sjn-mednest-management` (project ID `prj_Uhb73zzfpQjXxqa5bitk8jrp4uU2`).  
**Exact protected URL:** **https://sjn-mednest-management-2j99ywa0y-sjn1.vercel.app**  
**Preview protection:** Vercel Authentication remained enabled for all management project deployments; app does not accept credentials or connect to any database.

**Source files modified ONLY:** `apps/management/index.html`, `apps/management/styles.css`, `apps/management/app.js`, `apps/management/README.md`, `tests/management-step2-isolation.test.js`; **new** `apps/management/theme.js`.

### Theme implementation details

- `theme.js` is loaded before external CSS to apply a root `data-theme` early and minimize flash of wrong appearance. `data-appearance` distinguishes Auto vs an explicit user selection; dynamic meta theme color follows the effective mode.
- Theme choices are `system`, `dark`, `light`. Local-only storage key `sjn-mednest-management-appearance-v1` is a non-sensitive UI preference, **not credentials or tokens**. When storage is blocked, tab-local theme selection still works.
- Uses `matchMedia("(prefers-color-scheme: dark)")` plus its change event, with legacy `addListener` fallback; manual override takes precedence.
- Separate CSS light overrides for all current visual modules. Dark default stylesheet remains unchanged except new appearance and profile component classes. Existing strict Vercel CSP permits same-origin `theme.js` and still forbids client API connections/forms.
- The theme controls in both views use `aria-label` and `aria-pressed` and reflect one shared setting.

### Profile preview implementation details

- New **Member Profile** sidebar module and clickable generic avatar in the header.
- **Clearly labeled illustrative only** profile, including: display name, title, verified account placeholder, Chief Admin example role, status and activity placeholders; illustrative permission sections for staff access, content, courses, student enrollments and audit. These are **examples**, not actual access grants, named staff records or real authentication.
- Profile has no edit actions, no storage of identity and no backend calls. Later secure implementation must populate from trusted staff authorization sources.

## No work authorized or done beyond visual UI

- No working Chief Admin login, membership, RBAC, permissions, team invitations, personal profile data, audit events, Supabase Auth, schema or RLS changes.
- No existing student login/branding/theme, main Vercel project or production changes, MCQ or course edits.
- No full student LMS dark/light theme; management-only.
- No custom domain added or purchased.
- Further user review of both light/dark modes and mobile layouts is pending. Passing static CI and a READY deployment is not proof of browser visual acceptance.

## Next tasks after owner visual acceptance

Implement secure Chief Admin bootstrap, staff sign-in, MFA and real staff membership/role permission checks on the separate management origin; then verified member profile and Chief Admin-only permission editor, audit logging and regression/performance testing. Defer all actual staff privileges until explicit scoped authorization.

**For future chat:** This checkpoint supersedes older provisional “Owner” or “Super Admin” visible role suggestions, and corrects the earlier misleading `Madnest` handover filenames. The product is **SJN MedNest**, its privileged role label is **Chief Admin**, the approved workspace heading is **Academy Management Workspace**, future domain is **admin.<academy-domain>** and appearance preferences **Auto/Dark/Light** are now implemented in the management preview.
