# 2026-11-05 — OWNER-APPROVED ANALYTICS V1.2 TARGETED REFINEMENT (PENDING OWNER UAT)

**Scope:** User approved four small improvements only: date-dependent Unique Coverage, desktop Question Bank row alignment, Course subject→chapter expansion with per-attempt metrics, and graph nearest-point interaction/phone-safe tooltip. Staging only, production untouched.

**Period-specific unique coverage:** Added `periodCoverage` (bank/subject/chapter/topic distinct MCQs included in successfully submitted attempts in selected time range) to read-only `sjn_student_analytics` function. Counts skipped-as-covered, consistently with existing practice-bank semantics; `answered_unique` separately returned for future distinction. `bankCatalog` denominators remain all available MCQs and do not change with date filter. `lifetimeCoverage` remains returned for compatibility but no longer used by the Question Bank UI. A period with no submitted practice is 0 covered. SQL migration `database/migrations/20261105_student_analytics_period_and_course_detail.sql` applied to staging Supabase project `aozknkrwafowsrehdwlr`; no attempt or question rows changed.

**Desktop vs mobile:** At desktop widths >=801px, Question Bank subject/chapter/topic rows align the colored Correct/Incorrect/Skipped metrics in a centered middle column, with a larger row name, coverage, and accuracy. Mobile (<801px) retains stacked detail tiles. Existing academic palette and navigation preserved.

**Courses:** SQL `courseAttemptBreakdown` groups immutable saved question results by **individual attempt ID → course test → subject → chapter**. Test-level cards select latest completed attempt in the selected period by default, with a selector to inspect older attempts. Subject accordion displays total MCQs, answer accuracy, and expands to correct/incorrect/skipped and chapter-wise counts and accuracy only when metadata exists. No Course topics exposed; chapter names remain hidden within the exam-taking interface. Course-wide summary still covers all submitted attempts and is labeled as historical aggregate; one selected test attempt is never mixed with its retakes.

**Graph:** Desktop pointermove over the entire SVG plot, mobile pointerdown/touch, keyboard focus, and click select the nearest real recorded date. No fabricated interpolated data. Tooltip is kept within graph on desktop and becomes a full-width **below-graph panel on mobile** to avoid clipping and disappearing at endpoints. Tooltip displays date/period, accuracy, correct and answered count.

**Performance/security:** In-memory account-isolated cache, per-period data, authenticated API and existing RLS-invoker function retained. Endpoint now requires both new arrays to avoid silently returning incorrect coverage. Regression tests validate date-scoping, latest-vs-older Course attempts and chart event wiring. The owner must still verify the actual Chrome desktop/mobile UI and figures before final acceptance; CI and Preview READY do not substitute for personal UAT.

**Next work:** After owner review, discuss Mistake Diary. PDF performance remains owner-deferred FF-023. Admin Panel later. No other LMS features changed.

---

# 2026-11-05 — ANALYTICS V1 OWNER-APPROVED VISUAL REFINEMENT / DATE FILTER REPAIR

**Scope:** Staging development branch only; user explicitly approved redesign refinements after reviewing a 54-second Chrome recording. **Owner visual re-acceptance remains pending.** Production/main, content, course/exam flow, bookmarks, PDF reader, R2, Supabase schema and study history unchanged.

**Actual dated-filter root cause:** The Analytics `server.js` ISO timestamp validator used `\\d` inside a JavaScript regex literal, which matched a backslash followed by `d` instead of digits. Thus genuine period start/end ISO timestamps failed validation; `All Time` worked because it omitted them. Fixed the regex to `\d` and added an explicit regression test accepting a correctly formatted UTC timestamp while rejecting malformed dates. Existing staging SQL aggregation was separately verified under an authenticated RLS context with a time window. **Default period changed from Last 30 Days to All Time**; recent-period choices still available and must work, not be bypassed.

**Header/navigation:** Removed the large decorative Analytics icon; a compact chart icon now precedes the small `PERFORMANCE CENTER` kicker, consistent with other library/station headings. Sidebar retained left chart icon and replaced `INSIGHTS` text at right with a matching small chart-statistic icon.

**Visual design:** Retained approved Analytics layout and dark academic palette, while adding restrained gradient depth, better borders, accessible brighter captions, prominent accuracy/coverage figures and colored Correct/Incorrect/Skipped numerical tiles. Bank → Subject → Chapter → Topic rows now show unique-question coverage and each colored outcome as an accessible number and label. No Marked/Unused filters introduced in Course or Full-Length Past Papers. Reused existing Courses subject identities (Biology green `#34d399`, Chemistry purple `#a78bfa`, Physics blue `#60a5fa`, English amber `#fbbf24`, Logical Reasoning pink `#f472b6`), and Past Papers regional identities (Sindh `#65B3AD`, Punjab `#D4B066`, KPK `#B09ACD`, Balochistan `#B39434`, Federal `#879FC8`, NUMS `#D46AAB`). Course test and FLP cards have clearer completed-attempt and answer-outcome counts. Focus Areas show correct/incorrect/skipped alongside accuracy and sample size.

**Graph:** Replaced ambiguous short ISO-like date labels with readable month/day names; All Time groups by month, 90-day mode groups by week and shorter periods retain daily groups. Grouped accuracy is always `sum(correct)/sum(answered)` rather than a misleading arithmetic mean of percentages; no-data days are not manufactured. New keyboard-focus, pointer-hover and touch-friendly tooltip reports date/period, accuracy, answered, correct. Chart is still performance-only and does not claim exam readiness.

**Stability:** Existing account-isolated memory caching and post-submission invalidation remain intact; expanded tests validate the ISO-regex fix, All Time default, visual semantic color mapping, chart tooltip handlers, and cross-account isolation. CSS is scoped to `#module-analytics`, responsive and reduced-motion-aware. Staging database and release artifacts were not replaced or rewritten.

**Acceptance pending:** Owner should open My Analytics from staging and verify that All Time opens by default and that Last 30 Days, Last 24 Hours and Custom Range show valid data or an honest empty state (not Retry); check legibility, chapter/topic counters, course and regional paper cards, hover/touch tooltips, mobile layout and usability. Automated checks and READY status do not replace authenticated visual testing or guarantee sub-millisecond loading.

---

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
