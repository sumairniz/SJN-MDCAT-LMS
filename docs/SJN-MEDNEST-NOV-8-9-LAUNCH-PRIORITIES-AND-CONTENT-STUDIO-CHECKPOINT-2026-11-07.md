# SJN MedNest Academy — November 8–9 Launch Priorities and Content Studio Checkpoint
Date: 2026-11-07 Asia/Karachi. Development branch: `sjn-phase1a-foundation`.
Status: **Content Studio local draft phase coded and CI passed; not Vercel deployed, not database publishing**.

## Canonical identity and deployment context
- **Two websites only**: main Academy + entire Student LMS `sjnmednest.com`; separate Management Panel `admin.sjnmednest.com`.
- Student application source of truth for launch is current **staging LMS code and data** (`aozknkrwafowsrehdwlr`), not old paused historical production project. Do not directly relabel staging as production or skip backup/auth checks. Owner production cutover remains a separate approved release.
- Management authentication is independent Supabase `tdqbjhrmfluiinntmjfh`; protected Chief email security code was actually tested; staff invitations and team mutations still fail closed. No public domain routing done yet.
- Vercel Hobby API deployment request rejected with 402 `api-deployments-free-per-day` (quota 100/24h), so source-only updates until quota allows. GitHub CI continues independently; no additional subscription is authorized.

## What we can implement before Vercel quota resets
- Develop and unit-test full Management Panel UX in GitHub: Question Content Studio, Full-Length Past Papers, course/session authoring, resource management, academic review, students, permissions and settings.
- Apply **carefully isolated** database migrations and tests in correct scoped Supabase project when ready and authorized; never alter student exam/history pipelines for panel scaffolding.
- Build and test separate staff Auth API, safe draft creation/import/review. Content publishing from management to student DB must use separate server-side short-lived or private scoped credentials and strict permissions, never a browser-exposed student service role.
- Prepare secure release checks and rollback plan, academic source review, browser/mobile test scripts, performance baseline, domain DNS mapping and Auth redirects; keep website custom domain disconnected until tested.
- Cannot verify new Vercel browser UI or completed public-domain routing while quota blocked. CI pass isn't a substitute for full authenticated browser QA.

## Question Content Studio implemented in GitHub now
- `apps/management/content-studio-core.js`: dependency-free UMD parser/validator, CSV escaping/newlines/BOM, max 7.5M characters, max 10,000 draft rows, required columns, exactly 4 options, correct answer A-D, known subjects and two ordinary banks, mandatory traceable source for Past Papers Question Bank, English/LR taxonomy warning, region/year warnings, duplicate detection within current draft, never silently changes question wording/key.
- `apps/management/content-studio.js`: browser-memory drafts, CSV file import, template download, manual create/edit (source metadata, options, answer, explanation/mnemonic), pagination (40 rows), validation summary Ready/Review/Invalid, filter by validation, export unpublished draft JSON with original values, optional clear confirmation. **No backend request, no permanent server draft save, no student DB write, no publishing.** Browser refresh discards unexported draft (explicitly indicated).
- `apps/management/content-studio.css`: responsive desktop/mobile editor, review table and status.
- `apps/management/integrated-auth-preview.html` + `apps/management/app.js`: same existing professional Management Panel sidebar now shows Content Studio instead of placeholder in the protected isolated Chief preview; no student LMS front-end files touched.
- `tests/management-content-studio.test.js`: parser, security boundary, warning, duplicates, source protection, draft export and professional UI wiring regression tests; **two GitHub Foundation workflows passed on code commit `52adaa8b0a916a207ba9bdfd8a0efa8715bb6e41`**.
- New SJN Question Bank **only draft-authoring label**, not yet actually student-visible published bank. Existing Past Papers Question Bank and course exams are distinct and preserved. Draft duplicate detection works within the imported queue, **not yet against all previously published student MCQs**. Do not overclaim.

## Remaining high-priority functionality before a production claim
1. **Protected content backend:** SJN studio draft persistence in dedicated management DB, authenticated permission-controlled draft read/write, scoped academic review workflow. Import CSV and XLSX with idempotent batched staging and release gate; per-row provenance and historical revision preservation.
2. **Verified LMS write bridge and publication:** scoped management-to-student content publishing API; immutable attempt revisions, student bank taxonomy, original past-paper source, answer key and explanations preserved; distinguish course-only protected questions; safe rollback and audit. Existing student `mcqs` and revision history cannot be overwritten by direct frontend SQL.
3. **Complete Team & Permissions:** invitation registration/acceptance with email-confirmed exact address, step-up authorization, permissions, suspend/reactivate/remove, rate limits and adversarial E2E. Dedicated mutation API still `WRITES_ENABLED=false`; cannot claim team management complete.
4. **Remaining Management Panel modules:** Full-Length Past Papers, Courses & Sessions, Academy Resources uploads, Student Management and whole-feature/course access, Academic Reviews, Academy Settings; currently not production functional.
5. **Student deferred backlog:** prioritize only critical bugs; preserve results, exam timing, history, Review/Retake, Analytics, Mistake Diary. Resource PDF performance long-term optimization, allocation engine, diagram MCQs, 220-question plans, category refinements need independent regression and may remain deferred after honest owner-approved launch scope.
6. **Launch gate:** deploy after quota resets; protected desktop/mobile end-to-end test; backup/check current data, Auth redirects, environment variables and RLS; check hosting policy/limits and no unauthorized commercial use; DNS `sjnmednest.com` and `admin.sjnmednest.com` only after release approval; staged rollout + rollback plan.

## Suggested 8–9 November sequence
**November 7 remainder**: complete Content Studio draft foundation + unit tests, implement safe content staging backend next, finalize Owner-approved minimum launch features. Avoid repeated Vercel deployments.  
**November 8**: finish highest-impact features, batch deploy once quota allows, run authenticated Chief and student browser QA, test rollback and regressions, fix blocking failures.  
**November 9 (conditional release)**: public launch only if essential Academy + Management security, content/permissions, domain/redirects, backups, and usability gates have passed and Owner explicitly approves. If not, release a smaller clearly scoped free student LMS and keep unfinished Management Panel protected; never claim full panel complete when it is not.

### Scope and status discipline
- GitHub commits and passing CI do **not** mean that a feature is available at the old protected Management Panel URL.
- Don't make unsolicited DNS or production changes, activate staff writes, upgrade Vercel or advertise an unfinished module as complete.
- Older handovers may discuss legacy names and superseded decisions; latest canonical two-site decision overrides historical proposals.
