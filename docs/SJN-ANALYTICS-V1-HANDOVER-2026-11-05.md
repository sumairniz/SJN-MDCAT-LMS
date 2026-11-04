# SJN MedNest — Analytics V1 Staging Handover (2026-11-05)

**Owner approval:** Implement Analytics on staging with professional responsive UI, using the approved hierarchy, historical student data and global time selector. No Mistake Diary implementation was authorized in this phase; it is next. No production changes.

## Implemented
- Sidebar **My Analytics** in existing authenticated SPA, under a distinct **PERFORMANCE CENTER** header.
- Four in-module views: Overview, Question Banks, Courses, Full-Length Past Papers.
- Two separate practice banks: **SJN Question Bank** and **Past Papers Question Bank**, each with Subject → Chapter → Topic drill-down; breadcrumbs, sorting and volume/coverage indicators.
- Courses: Course → Test → Subject and available hidden chapter metadata; course topic-level labels intentionally omitted. Existing exam UI and course manifests untouched.
- Full-Length Past Papers: Paper → Subject → Chapter → Topic; not merged into the Question Bank category. Current published catalog used, never illustrative attempt numbers.
- Global periods: All Time, Last 24 Hours, Last 7/15/30/90 Days, Previous Month and Custom Range (10-year max); prior-equivalent-period comparison when valid. Period persists while navigating.
- Separate answer **accuracy** = correct/answered (skipped excluded), answered-question count, skipped count, verified completed-test count and **lifetime unique question coverage**. Coverage does not change with date filters. No inaccurate 0% score for no answers. Strength labels require at least 15 answered questions.
- Dark modern styling isolated to `#module-analytics`; responsive mobile layout, reduced motion, semantic colored performance indicators and friendly empty/error states.
- Single authenticated `GET /api/student-analytics` request to Supabase `sjn_student_analytics` SQL function: read-only invoker rights, effective RLS, authenticated user ID, compact aggregated JSON. No attempt data alteration.
- Client caches last five date views in memory for 90s; rolling time boundaries are minute-aligned. On confirmed submission, cache invalidates; on logout/account switch, prior private data is cleared. No localStorage/sessionStorage for scores.

## Data sources and limitations
- `attempts.details_version=1` + `attempt_items` + `mcq_revisions`; original legacy summary-only attempts do not contain trustworthy per-question answers, so they are explicitly excluded from detail metrics with an explanatory note.
- `mcqs` records provide current bank counts and lifetime distinct-question coverage; historical outcomes derive from immutable revisions, never mutable question keys.
- Published course manifest is `sjn_course_tests`; paper catalog is `past_papers`. Region paper attempts are identified using immutable revision bank and their saved title; course attempts use persisted `courseTestId`. Retakes are historical attempts and do not overwrite managed Course Last Result.
- **No SJN Question Bank records are currently published in the staging database.** Its empty state is intentional and not fabricated.
- Previously supported five practice filters are restricted to the two practice banks; they are not introduced into Courses or FLPs. Marked is not an Analytics performance outcome.
- The daily trend is based on recorded answers for days with activity. It does not predict MDCAT readiness.
- In-progress manual drafts are not scored. An empty saved period shows an honest empty state, never sample values.
- No query optimizations for massive future datasets have been proven; verify real response times and device memory after increasing student attempt volume.

## Technical files
- `database/migrations/20261105_student_analytics_v1.sql` — applied only on staging project `aozknkrwafowsrehdwlr`.
- `server.js` — `GET /api/student-analytics`.
- `public/index.html` — navigation, data bridge, reset/invalidation and script/style loading.
- `public/sjn-analytics.js`, `public/sjn-analytics.css` — Analytics UI and in-memory state.
- `tests/student-analytics.test.js`, `tests/student-analytics-render.test.js` — security, integration, structural and runtime smoke tests.

## Acceptance gates / next action
1. GitHub CI and Vercel Preview READY on latest commit.
2. Owner checks actual authenticated staging dashboard on desktop and mobile: Overview → Bank → Subject → Chapter → Topic, Courses, Past Papers, date filtering, empty states and design. This visual and performance acceptance is still **pending** and must not be claimed from CI alone.
3. Confirm representative real attempts on the signed-in owner account and spot-check against Test History; new historical data is never fabricated.
4. Only after owner acceptance, plan **Mistake Diary** in its separately approved design and data scope.
5. Admin Panel is future work; Academy Resources PDF performance remains **FF-023 owner-deferred**.

**Release safety:** Production/main untouched; no change to MCQ grading, stored answers, exam UI, course test availability, question flags, bookmarks, Test History, R2, or PDF reader.
