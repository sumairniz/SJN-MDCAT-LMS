# SJN MDCAT LMS Pro — Phase 4 Stage 3B: Question-Level History Architecture & Staging Implementation Plan

**Written:** 2026-10-18 (Pakistan time)  
**Status:** PROPOSED DESIGN / AWAITING OWNER REVIEW BEFORE DATABASE OR APPLICATION WRITES  
**Baseline:** GitHub repository \`sumairniz/SJN-MDCAT-LMS\`, development branch \`sjn-phase1a-foundation\`, code HEAD observed \`09f194d9485b3438a8e38654eeaa33a1a89e614b\`; staging Supabase \`aozknkrwafowsrehdwlr\` (NOT production \`yapvnevvjfewvafbjcgc\`). Recheck branch SHA and live DB before execution.  
**Grounding:** Read-only Supabase table/constraint/policy/index/function inspection and source review of \`server.js\`, \`public/index.html\`, \`public/sjn-phase4-preview.js\`, \`public/sjn-phase4-results.js\`, [Phase 4 blueprint v1.3](SJN-PHASE4-INTERFACE-BLUEPRINT-v1.3.md), [Stage 3A accepted Results](SJN-PHASE4-STAGE3A-RESULTS.md), [Future Requirements](SJN-FUTURE-QUESTION-BANKS-AND-CREATE-TEST.md).  
**No SQL executed, no test history deleted, no secrets accessed/stored, no frontend/server source changed, no GitHub \`main\` or production modification as part of writing this plan.**

## 1. Why Stage 3B exists

At baseline, the website generates a question list in \`currentQuizList\` and selected options in \`userAnswers\`. The visually accepted Stage 3A Results Screen computes correct/incorrect/skipped and per-test insights from that **in-memory** list. It calls the existing \`window.finishQuiz()\` to save a score to \`POST /api/attempts\`, but the server inserts only a summary: \`total\`, \`correct\`, \`accuracy\`, \`mode\`, \`subject\`, \`selection_json\`, title and user ID. \`GET /api/history\` returns summaries only. It cannot reconstruct which questions were shown, their exact original order, chosen answers or skipped questions.

**Critical observed issue:** \`POST /api/attempts\` presently accepts \`total\` and \`correct\` from the browser, then calculates \`accuracy\`; it does **not** independently validate the item list or score. The new pipeline must score the authoritative question answers on the server/database and **atomically** save the result plus all associated question-level records. This prevents casual score-payload tampering and split/partial history records; it **does not prevent all cheating** in ordinary practice because \`GET /api/content\` currently includes correct answers. Future premium/strict mock exams require a separate protected server-controlled question and answer-release design.

### Verified staging snapshot (2026-10-18; read-only)

| Table | Rows | Relevant constraints / policies |
| --- | ---: | --- |
| \`public.mcqs\` | **74** | IDs from the accepted original Biology bank, all preserved; public/anonymous SELECT, question keys currently visible to ordinary practice |
| \`public.attempts\` | **39** | PK \`id\`, FK \`user_id → auth.users\`, RLS ON, authenticated \`ALL\` policy for own rows; **summary only** |
| \`public.bookmarks\` | **2** | PK \`(user_id, mcq_id)\`, own-user RLS, linked to \`mcqs\` |
| \`public.profiles\` | **4** | Account records under student RLS |

Only primary-key indexes exist for \`attempts\`, \`mcqs\`, \`bookmarks\` at audit; there is no existing \`attempt_items\`, \`mcq_revisions\`, or \`submit_practice_attempt\` routine. The only public routine observed is \`handle_new_user\`. Applied Supabase migrations reported \`20261012215543_create_staging_lms_schema_and_rls\` and \`20261012221323_restrict_staging_signup_trigger_execution\`.

**Do not claim all 39 older attempts are reconstructable.** Their historical question IDs/options were never persisted. Keep their scores and dates intact and identify them as **Summary-only / Review unavailable**, rather than inventing wrong/used questions. Old attempt rows should not be included in question-level Used/Incorrect or Mistake Diary calculations unless future verifiable evidence exists.

## 2. Owner-confirmed product rules (not new decisions)

- Keep the current approved examination and Results Screen design. **Review Answers** is separate, with filters All / Correct / Incorrect / Unanswered / Marked; answers/keys/explanations, numbered navigator, no mutation to original result.
- **Retake** creates an independent new attempt containing the same question IDs in exactly the same order as the original; old score stays untouched.
- **One persistent per-user Mark for Review / Bookmark** system, not two. Existing \`bookmarks\` is the likely canonical table; don't duplicate it in history tables or invent a separate Bookmarks screen.
- Existing normal-practice **Tutor** (immediate feedback) and **Timed** (deferred correctness) semantics stay intact. Save & Exit and robust Resume are later parts of the approved blueprint and require a separately reviewed draft lifecycle; a completed test must **not** masquerade as a resumable draft. Strict course mocks must not inherit the same pause rule.
- Distinct regular question banks: a question belongs to **Past Papers Question Bank OR SJN Question Bank, not both**. The original 74 belong to Past Papers. Future premium course-test questions are separate protected content and are published to a regular bank only after an explicit **authorized Admin Panel team** action; never students or automatic expiration.
- The future Create Practice Quiz history filters (Unused default; optional Used/Incorrect/Marked, including all four together), overall Analytics and Mistake Diary are **later stages**. Exact Used/Incorrect/combined filters' semantics are deliberately not decided here.
- No production deployment, merge, test-history deletion, 74-MCQ rewrite, framework rewrite, or feature-preview bypass without separately scoped owner approval.

## 3. Proposed data design — additive, not a rewrite

### 3A. Immutable \`mcq_revisions\` (recommended to avoid duplicating full question text per student response)

One append-only revision per published MCQ version. Proposed columns:

| Column | Type / required intent |
| --- | --- |
| \`id\` | \`bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY\` |
| \`mcq_id\` | \`bigint NOT NULL REFERENCES public.mcqs(id) ON DELETE RESTRICT\` |
| \`revision_no\` | \`integer NOT NULL CHECK (revision_no > 0)\`, UNIQUE (\`mcq_id\`, \`revision_no\`) |
| \`bank\`, \`subject\`, \`chapter\`, \`topic\`, \`source\` | Authoritative metadata snapshot, copied from a reviewed MCQ revision |
| \`question\`, \`options_json\`, \`correct_index\`, \`explanation\`, \`mnemonic\` | Authoritative exact content/answer snapshot; options ordered and key validated |
| \`created_at\` | \`timestamptz NOT NULL DEFAULT now()\` |

Backfill revision 1 from the **existing 74** \`mcqs\` rows in one reviewed staging migration. Compare each field; do **not** type over original text. A later administrator correction must create a new revision instead of overwriting old revision content. The published \`mcqs\` row may remain the ordinary-bank display source while the revision link/identity is added as a compatible change. **Don't leave the live bank and its current revision diverging after future edits.** Exact current-revision reference/trigger strategy must be tested before later edit tooling ships.

**Why revision normalization rather than full JSON snapshot on every attempt?** Future tens of thousands of MCQs, many students and repeated attempts would otherwise copy the same long text/explanations into every answer row. A revision stores content once and a student's attempt points to the exact revision seen. This supports historical review after a question correction and makes storage/indexing more manageable. The simpler per-attempt JSON snapshot approach is a reasonable alternative but is **not** the recommended long-term default.

### 3B. \`attempt_items\` — ordered per-question student response records

| Column | Type / invariant |
| --- | --- |
| \`attempt_id\` | \`bigint NOT NULL\`, FK to existing \`attempts(id)\`; parent is completed test |
| \`user_id\` | \`uuid NOT NULL\`; must match parent \`attempts.user_id\` (enforce with composite FK/unique parent pair, not trust browser) |
| \`position\` | \`integer NOT NULL\` (1-based, preserve the original exam order) |
| \`mcq_id\` | \`bigint NOT NULL REFERENCES public.mcqs(id) ON DELETE RESTRICT\` |
| \`mcq_revision_id\` | \`bigint NOT NULL\`, FK to immutable revision, with consistency check that it belongs to \`mcq_id\` |
| \`selected_index\` | \`integer NULL\`; 0–3, where **NULL means skipped** |
| \`is_correct\` | \`boolean NOT NULL\`, **computed by authoritative DB grading**; skipped is false |
| \`created_at\` | \`timestamptz NOT NULL DEFAULT now()\` |

Primary key or unique constraint \`(attempt_id, position)\`; UNIQUE \`(attempt_id, mcq_id)\` to reject repeated question IDs in one test (normal generated bank tests); add appropriate index \`(user_id, mcq_id)\` for later student-history filters. A composite relation between \`attempt_id\`, \`user_id\` and the parent is important for isolation. Enforce \`mcq_revision_id\` and \`mcq_id\` consistency via composite FK/unique key, not ad-hoc client trust. Prefer FK restrictions/archival to physical deletion: existing questions and their historical revisions must remain referenced while history exists. Auth-user deletion remains separately governed by account privacy policy and parent cascade.

Skip is stored **distinctly** from wrong answers: for 50 questions, 40 correct + 7 wrong + 3 skipped reconciles to 50. Do not label a skipped question Incorrect.

### 3C. Additive metadata on existing \`attempts\`

- \`details_version smallint NOT NULL DEFAULT 0\` (0 = existing summary-only; 1 = complete, verified question-level records).
- \`submission_key uuid NULL\` plus UNIQUE \`(user_id, submission_key)\` for non-NULL keys to make network retries idempotent. When the same key is retried, return the original saved result only if payload identity matches; reject conflicting payloads.
- \`elapsed_seconds integer NULL\` (nonnegative) for the Stage 3A Time display in historical review; current browser-reported elapsed duration is **not a verified anti-cheat time source**.
- Optional \`assessment_kind\` / \`course_id\` future classification should be deferred or added under a later design, **not** used to mix premium mock questions into the publicly readable \`mcqs\` table.

All existing 39 rows remain \`details_version=0\`, with their original score and historical timestamp untouched. New rows are marked complete only once **every** item has been written and score reconciliation succeeds in the *same transaction*.

### 3D. RLS, privileges and indexes

- \`attempt_items\`: RLS enabled, student SELECT only where \`auth.uid() = user_id\` **and** parent belongs to same student; deny anonymous access, direct UPDATE/DELETE and unauthorized INSERT. DB constraints reinforce parent ownership.
- \`mcq_revisions\`: treat as immutable, restrict unreviewed client writes, do not publish premium/exam content here. Question content used for finished Review should be accessed only through an authenticated, owner-scoped read path or a properly scoped revision SELECT policy.
- \`attempts\`: **existing ALL policy and write grants allow an authenticated client to operate on its own rows directly**, an integrity issue for a verified grading system. Plan to replace with student SELECT-only and limit all score/item creation to a vetted atomic server routine. **Do not tighten this policy before the legacy \`/api/attempts\` path is replaced and regression-tested**, or the current website could stop saving scores. Investigate GRANT permissions alongside RLS; RLS alone is not a guarantee of immutable scores.
- Build indexes \`attempts(user_id, created_at DESC, id DESC)\`, \`attempt_items(user_id, mcq_id)\`, \`attempt_items(attempt_id, position)\` (or PK), and \`mcq_revisions(mcq_id, revision_no)\` (unique); verify through \`EXPLAIN\` and realistic data, not assumptions.
- \`bookmarks\` stays one account-scoped table. Its two current staging records must remain untouched. Later determine whether an unmark changes *live* mark state only, or also the archived *marked-at-submission* filter; never retroactively change the student's submitted answers or score.

## 4. Submission pathway — robust single transaction, no split writes

### Recommended request lifecycle

1. Browser creates a **per-submission UUID** (reuse this on retries) and supplies an ordered list of \`{mcqId, revisionId, selectedIndex|null}\`, with approved selection metadata/mode and elapsed duration. **Do not send or trust \`correct\`, \`accuracy\`, \`isCorrect\`, or question text as grading authority.**
2. \`POST /api/practice/submit\` verifies the student's current Supabase access token, signed HttpOnly cookie pair, same user, 24-hour absolute expiry and \`X-SJN-Expected-Student\` account-binding rule; validates JSON shape/size, integers, unique IDs/order, allowed bank, reasonable exam count, and valid mode. Reject malformed/stale requests without partial inserts. Select question revisions consistent with the issued/visible question set. The design of a server-registered test-start record (for proof of shown IDs and server-side timekeeping) can be added as a future draft/mock enhancement; **a browser-provided completed-list alone cannot prove which questions were really shown**.
3. Use **one PostgreSQL transaction**, preferably one reviewed Postgres RPC/function called from the existing authenticated server-side Supabase client, that locks/checks idempotency, gets trusted revision answer keys, computes correct/wrong/skipped counts, inserts **one \`attempts\` summary + all ordered \`attempt_items\`**, checks reconciled totals, then commits. Any error aborts the entire transaction; no half-saved history. Do **not** make independent PostgREST \`attempts.insert\` and \`attempt_items.insert\` calls and call them atomic.
4. **Privilege plan:** A narrowly defined and audited \`SECURITY DEFINER\` routine, if used, must have fixed \`search_path\`, schema-qualified references, explicitly checked \`auth.uid()\`, guarded \`EXECUTE\` grants, no unsafe dynamic SQL and strict question/role eligibility. Its privileged owner/bypass behavior must be security-reviewed and tested. Do not send service-role credentials to the browser. Authenticated users could in principle call a PostgREST-exposed RPC directly with a valid JWT even without the app's 24-hour cookie; **validate all scoring, ownership and entitlement constraints inside the RPC too**, and do not confuse the app cookie check with a database-wide session-expiration guarantee. Alternatives using limited server DB privileges should be evaluated before final SQL approval.
5. On success return \`attemptId\`, totals and saved state from authoritative database result. The approved Stage 3A Results Screen should only say **Saved** after the complete transaction is confirmed. Correct answers/insights continue to display once the submitted data has been verified; if saved grade differs from browser calculation, explicitly reconcile/re-render rather than silently accepting an inconsistent score.
6. Duplicate submit/network retry: same student + submission key + identical payload returns same attempt, no added score. Same key with different payload returns explicit conflict; other user may never see/use the first user's attempt.
7. Preserve legacy \`GET /api/history\` summaries. Introduce a **read-only authenticated** \`GET /api/history/:attemptId/questions\` for fully persisted items with \`position\`, saved choice, correct choice, explanatory revision, and current mark state, only when \`attempt.user_id\` equals authenticated user. Return a clear **Summary-only / no item history** result for existing records.

### Important compatibility and security transition

The existing website (including old/default quiz flow) still calls \`POST /api/attempts\` with **client-supplied totals**. An immediate database privilege lock would break it. **Migration sequence must transition both old and Phase 4 clients to the new server-graded route (or explicitly disable the old unsafe route with truthful UX) BEFORE revoking direct DML.** Do not leave an insecure legacy write route exposed after claiming score integrity is enforced. Maintain 24-hour sessions and cross-tab account switching throughout.

The ordinary practice \`/api/content\` currently returns correct answer keys publicly; server-side grading protects stored-score integrity against simple total spoofing, but **is not an exam anti-cheat guarantee**. Separate restricted premium/mocks must use a different protected question/answer release architecture.

## 5. Historical Review, Retake and Save & Exit boundary

- **Completed detailed attempts:** History list displays existing summary plus a \`Review\` / \`Retake\` entry only when \`details_version=1\` and the full question set is verified. Review uses immutable revision content as seen at submission; filters **All / Correct / Incorrect / Unanswered / Marked**, answer letter/text, explanation and mnemonic. Review never updates old score or selected choices. Marks can be toggled through the **one** existing account-scoped mark store.
- **Retake:** Backend loads the *same ordered question IDs* from a completed user's attempt, checks current eligibility and retains the original score. A newly started test gets fresh selected answers, new submission key, independent score. If a question was archived/revised, **review old revision remains accurate**; whether retakes show the original revision or latest published revision requires a distinct owner decision. Never silently substitute unrelated MCQs.
- **Legacy 39 attempts:** score/time/date stay visible; no fabricated Review/Retake question list. Display \`Detailed review unavailable for this older test\`. Preserve their contribution to existing aggregate totals until owner decides otherwise.
- **Save & Exit / Resume:** Not the same as completed-attempt persistence. A later phase will need authenticated draft/session storage with stable ordered revisions, chosen options, checked flags, current position and remaining Timed Practice clock, autosave failure handling and session identity. Until that is implemented, Stage 3A's exit warning that incomplete attempts are lost must stay truthful. Normal Timed Practice may pause on Save & Exit per blueprint; strict paid mocks will have separately approved rules.
- **Report Issue and persistent Mark:** Report Issue remains unsaved/disabled until reviewed reporting storage; mark existing \`bookmarks\` is account-scoped and now has MCQ FK backing but Stage 2 preview integration still needs behavioral verification. Do not confuse fixing that UI with Stage 3B schema authorization.
- **Future Create Practice Quiz:** Unused by default, Used / Incorrect / Marked selectable together including all four. Do **not** decide filter union/overlap and \`Incorrect\` semantics in the current persistence migration.
- **Premium course tests:** require independent restricted storage/eligibility and no student-visible chapter/topic labels; do not insert premium answer keys into ordinary bank tables or assume the current public \`/api/content\` can serve them.

## 6. Ordered implementation and approval gates

| Gate | Work | Requires permission? |
| --- | --- | --- |
| **3B-0 — THIS DOCUMENT** | Read-only audit, architecture and acceptance plan; record GitHub rationale/history | Owner's request to start the design; **no DB writes** |
| **3B-1 — schema + backfill** | Review concrete forward/rollback SQL, indexes, RLS/grants and function permissions; create \`mcq_revisions\` and \`attempt_items\`, add nullable/compatible metadata to \`attempts\`, backfill exactly the 74 reviewed revisions | **Separate explicit STAGING SQL approval** before execution |
| **3B-2 — backend** | Authenticated transactional submit, owner-scoped detail read, trusted scoring, idempotency/error cases, and compatibility for existing legacy submission route | Scoped development-branch code approval; measure tests and no production deploy |
| **3B-3 — frontend** | Preserve approved Stage 2/Stage 3A UI; carry stable revision IDs, submit reliable payload exactly once, render authoritative saved result and correct unavailable/error states | Scoped development-branch code approval and browser acceptance |
| **3B-4 — write lockdown** | After *both* old + new quiz paths stop directly writing client scores, revoke/restrict direct attempts DML and tighten RLS/grants; verify student isolation and 24h session | Explicit STAGING policy/grant migration approval; rollback/compat review |
| **3B-5 — Review/Retake UI** | Separately implement approved historical Review and Retake navigation, exact order, owner-only history and marked filter; do not enable disabled buttons before records exist | Scoped feature approval and desktop/mobile/user acceptance |
| **3B-6 — later draft/report/filter work** | Save & Exit, Resume, Report Issue storage, Create Practice Quiz history filters, analytics/mistake diary, premium course tests/Admin Panel | Future owner-approved phases; not this migration |

**Do not replace existing authenticated attempt-save functionality with a placeholder while implementing the new path.** A partially integrated schema must be additive and allow existing student actions to continue until the cutover is explicitly tested.

## 7. Staging migration safety and rollback plan — unexecuted

1. Reconfirm project ref, current branch HEAD, applied migration list, table shapes/roles, RLS/GRANTs, and exact baseline counts. Capture a **restricted backup/restore path** for the 74 MCQs and existing 39 testing attempts; avoid exporting student personal data to public GitHub. Determine table ownership/privileged function grants before SQL.
2. Write and locally review **versioned additive SQL**, not an ad-hoc SQL Editor paste that cannot be recovered by future developers. Validate new function privilege semantics and PostgREST discovery.
3. Use staging migrations to add tables/columns, backfill the 74 revision-1 records and verify **74/74 matches** field-by-field against \`mcqs\` and preserved original bank. Check each new history table starts empty; current 39 summary rows and existing 2 marks remain unchanged.
4. Verify a staged signed-in Student A can read only Student A's historical question items; Student B, anonymous, expired token/cookie and stale account-switch cannot access or modify them. Even if an RLS test fails, **no demo production data or keys are used**.
5. Test a fabricated 10-question test (correct/incorrect/skipped), exact ordering, trusted scoring, selected-index validation, double submit, network retry, concurrent submit, missing/archived revision, invalid bank, invalid identity, transaction rollback injection, 24-hour expiry, mobile and multi-tab scenarios. Check consistency \`correct + incorrect + skipped = total\`.
6. Test existing legacy history/score/login functionality and original 74 source hash \`a2e57e72716394e8\`; no fabricated old question history. New saved results visible under the correct student; no extra duplicate rows.
7. **Rollback:** before new client rollout, additive tables/functions can be abandoned without touching historic rows, provided references/backfill effects are analyzed. After users save new question-level attempts, **do not drop their tables or results casually**. Prefer a forwards-compatible corrective migration or owner-approved backup/restore of only affected staging records. Never rollback production without a separate release decision.
8. Record actual commits, Supabase migration version, CI results, manual owner acceptance, failed attempts and final method in Master Development Plan. Any preview-only workaround is registered in [Temporary Change Register](SJN-TEMPORARY-CHANGE-REGISTER.md) in its introducing commit with retirement conditions.

## 8. Decisions still open — request before actual SQL

1. **Revision design approval:** Prefer normalized immutable \`mcq_revisions\` + compact \`attempt_items\` over per-item full JSON snapshots for scalability. Would the owner like this long-term approach? It does **not** redesign Create Test or introduce admin/premium content today.
2. **Retake after a correction:** Same MCQ IDs/order using its *latest corrected version* vs the *exact original revision*; must be stated before Retake UX is enabled. Until resolved, do not silently change historical review.
3. **Allowed practice-test size / abuse protection** for the transactional submission; current frontend accepts a very large numeric count. Engineering should propose a conservative maximum during API implementation and validate with owner.
4. **Legacy stats scope:** Preserve all current 39 testing summaries and their displayed totals by default; owner can later approve deletion/recalibration when needed, but no deletion in this phase.
5. **Auth and privileged routine design:** Independently review \`SECURITY DEFINER\` / role grants and direct RPC access, and choose exact exposure model before granting privileges.
6. **Future draft/mode and course eligibility rules:** Keep deferred; do not overfit Stage 3B regular practice tables to unfinalized premium mock behavior.

## 9. Handover — what is done and what is not

**DONE:** Verified existing source/API/schema/RLS constraints, identified score trust and legacy data limits, recorded proposed long-term schema, server-scored atomic pipeline, migration/testing/rollback and future acceptance gates.

**NOT DONE:** No SQL, new table, backfill, code change, migration execution, actual server scoring, historical Review/Retake UI, Save & Exit, analytics or premium-course functionality. Nothing should be reported as implemented or approved merely because it appears in this document.

**Next operator action:** Present this design to the owner. With explicit staging-only SQL authorization, convert Gate 3B-1 into a reviewed migration file and validation script, then obtain a separate execution decision before applying it. Stop if changed Supabase schema or owner requirements invalidate the audited baseline.
