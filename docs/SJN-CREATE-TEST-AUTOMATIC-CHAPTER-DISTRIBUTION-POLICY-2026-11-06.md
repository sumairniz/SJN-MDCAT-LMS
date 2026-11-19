# SJN MedNest Academy — Create Test Automatic Chapter Distribution Policy

**Owner decision date:** 2026-11-06 (Pakistan time)  
**Status:** **OWNER-AGREED PRODUCT RULES — DOCUMENTED; NOT IMPLEMENTED**. The exact weighting/rounding algorithm, detailed edge-case UX and technical integration still require their own approved design and implementation.  
**Scope:** Student-generated **Create Practice Test** selection where multiple chapters are selected. This does **not** authorize changing fixed/curated My Courses assessments, Full-Length Past Papers, published MCQs or historical attempt scores.  
**Development branch:** `sjn-phase1a-foundation`. **No main/production work authorized.**

## 1. Student experience and basic behavior — agreed

1. **Automatic chapter distribution only.** Students select the desired bank, subjects/chapters (and topics where the existing wizard permits), the number of questions, existing category filters and test mode. They **must not** be offered a per-chapter **Custom Distribution**/manual quota option. This rejects/supersedes the older optional FF-003 idea.
2. **Every selected chapter must contribute at least one eligible MCQ** if the request is feasible. The student is not asked to set chapter allocations. Chapters should not be silently dropped merely because other selected chapters have larger banks.
3. **Balanced, but meaningfully weighted.** Chapter allocations should be reasonably close, yet not artificially equal. Chapters with substantially larger overall published MCQ inventories may receive **noticeably more** MCQs (e.g., 9 versus 5), without dominating the test. Neither strict equal splits nor raw bank-size proportional splits are desired.
4. **Overall published content count is the weighting basis.** Compare the number of unique, currently published/permitted MCQs in each chosen chapter **within the selected question-bank scope**, independent of an individual student's Unused/Incorrect/Skipped/Marked/Correct membership. Use this overall count even when a category filter leaves only a few eligible questions. This is an academy-managed **bank-size proxy** for emphasis, **not proof of official MDCAT chapter weightage**. Unpublished/archived, unrelated banks or premium-course-only content must not inflate ordinary bank weights.
5. **Exact existing student filters are mandatory.** The default Unused filter and any multi-selected filters retain their **approved OR/union semantics**, per-student latest-submitted outcome and persistent Marked state. Do not silently include questions outside the chosen filters just to meet a chapter's intended allocation. Do not invent eligibility from unsaved drafts or old summary-only attempts.
6. **No duplicates in one test.** Only genuine eligible unique MCQs are selected, sampled randomly within each chosen chapter so identical settings need not yield identical questions. Preserve stable IDs, validated revisions, existing modes, scoring, History, Results and Retake behavior.

## 2. Crucial shortage rule — owner explicitly clarified

**The weighted chapter allocation is a target, not a compulsory minimum.** If the weighted plan would assign **9 MCQs** to a chapter, but only **7** MCQs from that chapter are currently eligible under the student's chosen filter(s), **select 7**. Do **not** take two Correct/Used or otherwise ineligible questions, do not repeat MCQs, and do not require the chapter to provide 9.

- The **2 unfilled slots may be redistributed to other selected chapters**, using only their genuinely filter-eligible MCQs and keeping the resulting test as balanced and meaningfully weighted as availability permits.
- The **total number of MCQs requested remains the target**. If there are enough distinct eligible questions overall and all selected chapters can be represented, redistribution should satisfy the request without reporting a false shortage.
- If the **combined eligible pool truly cannot supply the requested total**, show a clear, accurate limitation, with the affected chapter(s) and eligible counts, suggesting a lower test length, different chapters or revised filter selection. Never silently return a shorter-than-requested test as if the full request succeeded.
- If **any selected chapter has zero eligible questions**, the every-chapter coverage rule cannot be met: explain this clearly rather than silently excluding the chapter or violating the filter. If the request asks for fewer MCQs than the number of selected chapters, coverage is mathematically impossible; flag that constraint rather than faking coverage.
- A chapter with **some** eligible questions below its planned weighted target is **not itself a reason to block the test**. Its actual contribution is capped by the eligible count, with the remainder reallocated when possible.

**Worked shortage illustration:** A weighted plan calls for 9 from a particular chapter, the student has 7 Unused questions there, and other selected chapters have sufficient Unused questions. The result is **7 from that chapter**, and the other **2** come from other selected chapters using **Unused only**. No error is needed when the entire requested test can still be legitimately filled.

## 3. Illustration of meaningfully bounded weights (not fixed quotas)

For 50 questions across 7 selected Biology chapters:

| Illustrative chapter | Overall published bank count | Illustrative test allocation |
| --- | ---: | ---: |
| Biomolecules | 520 | **9** |
| Cell Structure | 410 | **8** |
| Biological Enzymes | 370 | **8** |
| Bioenergetics | 310 | **7** |
| Nutrition | 250 | **7** |
| Transport | 180 | **6** |
| Gas Exchange | 120 | **5** |
| **Total** | — | **50** |

These are **invented explanatory counts**, not verified database chapter sizes or immutable quota rules. The owner explicitly favored this type of meaningful 9-to-5 distinction over an almost-equal 8-to-7 split. Chapter weights should scale intelligently with test size, selected chapter count and available qualifying pool; avoid unlimited skew and avoid a hard-coded allocation for these particular names.

## 4. What is and is not decided

**Confirmed product direction:**
- One simple automatic generator; **no per-chapter custom allocation** controls.
- All chosen chapters represented whenever feasible; otherwise an honest constraint message.
- Balanced **but visibly weighted** by **overall published chapter MCQ counts**, not filtered/student-specific counts.
- Filter is **never bypassed**; the available count under the filter caps the chapter's actual allocation.
- Reallocate shortfall from an under-supplied chapter to other eligible selected chapters when possible.
- Requested total, uniqueness, correct source scope and validated published identities retained.
- Show specific helpful feedback when genuine shortage makes the test impossible.

**Engineering details still to propose/test before coding (not automatically approved):**
- Exact monotonic weight-softening function, fairness boundaries, rounding and tie-breaking; no numerical formula or percentage limit has yet been owner-finalized.
- Efficient availability-aware allocation across mixed subjects, topic-restricted selections, and unusual bank mixes. Do not introduce unapproved subject quotas or override existing Topic Drill scopes.
- How to phrase and place count-limitation messages in the existing wizard while preserving its accepted appearance.
- Performance and reproducible QA for large banks, many chapters, combined filters, retakes and concurrent publishing changes.

## 5. Scope, QA and next phase

This is a **documented policy**, not permission to edit the active examination engine. Before implementation, propose a minimally invasive allocator, verify it against test fixtures including **9 target / 7 eligible**, zero-eligible chapters, scarce pools, 50 questions/7 chapters, mixed OR-filters, already-used MCQs and randomized seeds. Preserve the selected content's immutable revisions and avoid performance regressions in Create Test, submit, History, Result and Analytics. A dedicated implementation approval and staging QA are required.

**Next strategic step:** Continue **Admin Panel planning**, which should account for published bank inventory and authorized MCQ uploads. Do not change the live selector or production as a side effect of this decision.

**Cross-references:** [Master Development Plan](SJN-LMS-MASTER-DEVELOPMENT-PLAN.md), [Future Features & Deferred Decision Register](SJN-FUTURE-FEATURES-AND-DEFERRED-DECISIONS-REGISTER.md) FF-001 / FF-003, [Create Test Filters Decisions](SJN-CREATE-TEST-FILTERS-DECISIONS-2026-10-22.md), [Future Question Banks & Create Test](SJN-FUTURE-QUESTION-BANKS-AND-CREATE-TEST.md).
