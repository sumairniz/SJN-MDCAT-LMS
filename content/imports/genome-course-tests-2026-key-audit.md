# Genome Test Session 2026 — staging practice import key audit

Owner-approved **practice-only** source corrections. These imports are derived from owner-supplied files. Questions were normalized into four options for the existing SJN examination engine. The imported text is **not claimed to be a verbatim reproduction** of the original Physics handout; ambiguous questions and diagrams were expressed in clear text where needed.

## Test inventory

| Test # | Source | Questions | Notes |
|---|---|---:|---|
| 01 | `acellular life.docx` | 16 | Explanations condensed; Q12 AIDS diagnostic definition and Q13 HIV latency wording scientifically clarified |
| 02 | `Force & Momentum.pdf`, **Test 01 only** | 45 | Concise explanations written; audited original key and rewritten ambiguous/mathematical/diagram-dependent text |
| 03 | `MDCAT_Reproduction_MCQs.pdf` | 18 | Source keys maintained; new concise explanations |

## Physics Test 01 — changed answer-letter entries

| Question | Source PDF key | Imported key | Reason |
|---|---|---|---|
| 02 | E (nonexistent) | D | Momentum depends on mass and velocity, not acceleration |
| 14 | E (nonexistent) | D | Third-law contact impulses have equal magnitude |
| 19 | B | A | Bullet–block ballistic pendulum gives approximately 8 × 10² m/s |
| 24 | E (five-option item) | A | Existing engine supports four options only; **correct equal-mass answer moved from original E to new A**, distractors changed |
| 38 | D | A | Recoiling 234u daughter has velocity −4v/234 from momentum conservation |
| 39 | A | D | Shell remaining mass 3m/4 has velocity 4v/3 by conservation of momentum |

Other important normalized cases: Q21 uses **velocity** (signed rebound); Q27 explicitly states 60° to the wall normal; Q35 explicitly states the source object is initially stationary, and its clarification was saved as a **new MCQ revision**, preserving the original imported revision; Q42 specifies a *closed ball–sand–Earth system*; Q45 specifies the transferred board momentum. The numerical and graphical source includes damaged expressions and diagrams: see the source PDF before treating these as publishable academy-authored tests.

## Test architecture (staging only)

- Supabase project: `aozknkrwafowsrehdwlr`. Three records in `public.sjn_course_tests`, exactly 16/45/18 ordered immutable current MCQ revisions, separate bank `SJN MedNest Course Tests`.
- The existing `sjn_submit_practice_attempt` database function accepts course-bank MCQs **only if** the submitted course ID points to a published test with the exact full ordered MCQ ID list; server-verified scoring and student history remain unchanged for Question Bank and Past Papers.
- Student-authenticated `GET /api/course-tests` derives Completed from saved `attempts.selection_json.courseTestId`, and In Progress from manual `practice_drafts.selection_json.courseTestId`. No fake attempts or progress records are inserted.
- Course launch and historical Retake reuse the existing shared exam engine with `courseTestId` and course duration in the verified submission/draft metadata. Source badge uses `TEST 01`, `TEST 02`, `TEST 03`.
- No actual enrollment/entitlements infrastructure has been built. Genome is exposed to authenticated staging students for this explicitly approved integration test; other sessions remain illustrative/locked. Production Supabase, `main`, and existing student attempts are untouched.
- **Student/browser UAT is still required**, including Tutor, Timed, Save & Exit/Resume, Submit, Result, Test History, Review, Retake and mobile; CI + DB integrity do not replace that testing.

**Do not publish these provisional third-party practice questions as finalized official academy content without a separate accuracy/rights review.**
