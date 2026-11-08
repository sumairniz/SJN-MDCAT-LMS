# SJN MedNest — FF-008 Restricted Course Entitlement Release Audit
Date: 2026-11-08 (Asia/Karachi). **Read-only diagnosis, no student data or RLS modification.**

## Verified staging findings
- Student LMS staging project: `aozknkrwafowsrehdwlr`. Earlier verified question bank has **79** restricted `SJN MedNest Course Tests` MCQs (of 1,275 total).
- SQL `pg_policies` on `public.mcqs` reveals exactly the public-read policy named `Public read access for content`, `roles={anon,authenticated}`, `cmd=SELECT`, `qual=true`.
- SQL privilege check: `anon` can SELECT `public.mcqs`, `authenticated` can SELECT; `authenticated` cannot UPDATE.
- Staging public schema includes `courses` and `sjn_course_tests`; no table with names containing `enroll`, `entitle`, or `access` was found. This does not independently prove no access logic elsewhere; a complete API/code audit is necessary.
- Thus under current table RLS and grants, the restricted course MCQ rows are not protected from direct anon database reads **at the MCQs table level**. This must be addressed before publishing restricted content to paying/unapproved students.
- This is FF-008 `Real course enrollment, paid access and server-enforced entitlements`, already designated a production RELEASE BLOCKER in `SJN-FUTURE-FEATURES-AND-DEFERRED-DECISIONS-REGISTER.md`.
- No private user tokens, student attempts, questions or answer keys were retrieved for this investigation; it is a schema/permission inspection only.

## Correct remediation sequence (future scoped work)
1. Inventory existing student content load path: `server.js`, `/api/content`, course-test APIs, admin publishing and direct Supabase Data API readers. Quantify any anonymous clients that depend on open read before touching RLS.
2. Finalize owner-approved whole-session/whole-feature entitlement and exception rules (never a premium flag on individual questions). Current Genome pilot may be made explicit public/free if Owner chooses; protected future courses must use enforced server-side entitlement checks.
3. Implement enrollment/feature access model in staging with account ownership and scoped access policies; allow ordinary public Question Banks but restrict course-only question source and answers. Prefer server-authorized projection/API by selected banks, not broad client SELECT across all MCQs.
4. Test anonymous, unenrolled, enrolled, suspended, wrong-user, restricted-course and account-switch cases, ensuring Tutor/Timed, Results/History/Analytics/Mistake Diary remain correct and fast.
5. Stage and carefully roll out new access policies only after all legitimate student readers work correctly; test rollback, then Owner browser acceptance. Do **not** simply revoke current `mcqs` SELECT in place, as this may break the existing student exam/content pipeline.

## Prioritized follow-up
This is a material **launch safety issue**; avoid treating FF-001 distribution engine, FF-023 PDF speed or other explicitly deferred enhancements as equally urgent until the authorization path and course exposure are resolved.
