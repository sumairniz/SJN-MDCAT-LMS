# SJN MDCAT LMS Pro — Phase 4 Approved Interface Blueprint (v1.2)

**Status:** Owner-confirmed interaction and design requirements; implementation in phases on `sjn-phase1a-foundation` only.  
**Inputs:** Owner's 22-page recovered MCQ conversation, Blueprint v1.0, later confirmations through 2026-10-15, original Saeed MDCAT/MedSindh/SJN screenshots, and the newly supplied results-card screenshot.  
**Precedence:** Explicit later owner decisions override conflicting ideas in earlier chat, mockups, or Blueprint v1.0. External screenshots are **component references**, never a replacement for SJN's existing background, header, brand, or overall UI.

## 1. Scope and guardrails

- Preserve the existing LMS, signed-cookie authentication, 24-hour absolute expiry, account separation, existing history, questions, explanations, mnemonics, and Create Test wizard.
- All 74 original hardcoded Biology MCQs remain available throughout development. Supabase staging `mcqs` was empty at the start; never let an empty API response overwrite the original bank.
- Work exclusively on the development/staging branch. Do not touch production database, production deployment, `main`, or merge/ready the draft PR without separate explicit owner approval.
- Stage the implementation: code/content audit → dedicated UI → quiz interactions → secure persistence → results/review/retake → regression/device acceptance. Test each phase before proceeding.
- No keyboard shortcuts, difficulty labels/analytics, Pass/Fail labels, separate Bookmarks page, or immediate Create Test redesign. Question-history selection filters come after question-level storage is reliable.

## 2. Student journey

Existing Create Test wizard → dedicated examination page → Submit Test → results → Review Answers / Retake Test / New Test / Dashboard.

Alternative: examination → Save & Exit → In Progress in Test History → resume unchanged attempt.

Exact route: `quiz.html` preferred by owner **if** secure, uncomplicated separation is feasible after code review.

## 3. Dedicated examination page

**Existing branding:** Retain the original LMS black/charcoal/red/white background and visual identity, not a new decorative design or generic reference header.

**Compact top bar:** Exit icon (opens a Cancel / Save & Exit confirmation), Tutor or Timed mode badge, question progress, **dedicated red timer/elapsed-time block**, navigator icon and red **Submit** action. On mobile, aim for one compact horizontal row with short text or icons; make it usable on narrow screens without tiny touch targets. Desktop may use slightly fuller labels.

**Question metadata:** Preserve the current **red subject badge**, existing **chapter/topic plain-text styling** and **amber/yellow source/year badge**. Never convert all metadata into new multicolored pills. Allow long chapter and topic names to wrap rather than truncate beside the source badge. Show subject, chapter, topic, source/year where available.

**Question panel:** Clear question statement; four touch-friendly answer rows. Each row begins with a small separate A/B/C/D rounded letter block in subtly different charcoal, with neutral white/gray text. No permanently bright-colored letter labels; correctness coloring only when appropriate to test mode. Retain existing SJN concept explanation and mnemonic styles, improved for clarity.

**Mark for Review:** One control, in the existing upper-right area of the question card. It marks the question in the current navigator and persists to the student's account for the eventual Marked Questions Create Test filter. Unmarking clears both. No separate bookmark system/page. Marks must survive new sessions/devices securely.

**Navigator:** Desktop right-side panel **open by default**, Show/Hide to expand question area. On mobile, icon opens a **right-side drawer** with close button and backdrop; navigating to a question closes it. Support hundreds of question numbers. Current/answered/unanswered/marked statuses remain distinguishable. Tutor shows live correct/incorrect counts; Timed Practice never reveals correctness before submission.

**Tutor Mode:** Clicking an option immediately checks it (no Check Answer button). Green correct answer, red wrong selection if any, answer key with letter and answer text, explanation and mnemonic. Lock that question's answer after checking; previously answered questions may be revisited to read explanations.

**Timed Practice:** Countdown; student can change responses before submitting; no correctness highlights, answer key, explanation or mnemonic during the running test. Save & Exit pauses countdown and resume continues with the **remaining** time. Future strict mock exam rules remain separate and are not implemented under normal practice rules.

**Navigation/submission:** Previous/Next and direct navigator selection. Submit Test always available. If unanswered remain, confirm using only the number unanswered and **Review Unanswered** / **Submit Anyway**; no score/revealed correctness. All answered → simple confirmation. Full results only on final submission. No accidental auto-submit merely by navigating to the last question.

## 4. Main results page — latest owner-confirmed reference

**Do not copy the screenshot's header or background. Use existing SJN LMS styling.** The supplied screenshot is a specific reference for the accuracy ring, four statistic cards, and desktop arrangement.

Vertical order, desktop and mobile:
1. Centered heading **Practice Test Completed!**
2. Subtitle **Here is your performance summary report.**
3. Large centered **circular accuracy progress indicator replacing both the trophy and the previously proposed medical emblem**. Percentage in the middle; start **at 12 o'clock**, fill clockwise to 100%. A subtle textured/braided appearance is desirable **only if it is easy, lightweight, and maintainable**. Otherwise use an elegant simple progress ring. No additional emblem.
4. Centered, clean white **Correct / Total**, e.g. **40 / 50**, positioned **between the accuracy circle and the four cards**. No separate Total Questions hero/card.
5. Four result cards based closely on the owner's reference screenshot in ONE desktop horizontal row: **Correct (green)**, **Incorrect (red)**, **Skipped (yellow)**, **Time Taken (white/neutral)**, with colored headings/borders, clear values, and suitable icons. Time e.g. **15:32** includes an understandable small `M:S` indicator. On mobile show **2 by 2**: Correct/Incorrect then Skipped/Time.
6. Four primary action buttons in ONE desktop horizontal row: **Review Answers** (SJN red primary), **Retake Test**, **Return to Dashboard**, **Create New Test** (suitable charcoal secondary styling and theme-consistent icons). Responsively reorganize on mobile; do not copy reference buttons/icons verbatim.
7. A separate **Performance Insights** control **under all four actions**. Hidden/collapsed by default; tapping expands detailed performance **on the same page below the control**, collapsible again. Show subject-wise, chapter-wise, topic-wise **horizontal progress bars**, never more circular rings. Show only categories applicable to the attempt.

**Common accuracy thresholds**, for the circle percentage/ring and each subject/chapter/topic bar:
- 0–49% red
- 50–79% yellow
- **80–100% green**

No question-number palette on the main results screen, difficulty-wise analytics, or Pass/Fail label.

## 5. Review, Retake, reporting and safe history

- **Review Answers** is a separate question-by-question experience, accessible from results or Test History, with a numbered navigator and filters **All, Correct, Incorrect, Unanswered, Marked**. Show the student's selection, correct answer with letter/text, explanation and mnemonic. Review never modifies the original completed score; marks remain editable.
- **Retake Test** makes a NEW attempt using the **same saved question set in exactly the same order**, fresh answers and fresh score. Original attempt and result remain in history.
- **Report an MCQ Issue** supports wrong key, ambiguous question, spelling and explanation errors in student-friendly language; store reports for later administrator review, without exposing administrative controls.
- **Save & Exit** preserves questions/order, responses/statuses, current position, mode, timing and marks. It does not create a completed score. Background draft saving protects against accidental closure/network interruption. History labels unfinished attempts **In Progress**, with Resume Test.
- Question-level answers, original question identifiers and marks must be persisted under the verified student identity with RLS. Design additive migrations and history compatibility only after inspecting existing schema; never overwrite or delete previous attempts or accounts.

## 6. Implementation choices delegated to engineering

- Build accuracy ring via lightweight CSS/SVG if feasible; prefer a simple attractive fallback over heavy dependencies.
- Verify `quiz.html` security and session handoff before introducing a standalone page.
- Design additive, RLS-checked question-level persistence, marks and draft recovery only in the staging environment after separate review.
- Ensure one-row mobile top controls remain accessible even on very small phones.

## 7. Reference mapping retained for future design reviews

- Current SJN mobile MCQ `1000390821.jpg`, feedback `1000390823.jpg`, results `1000390833.jpg`.
- Saeed desktop exam `image(20261011-211529).png`, mobile exam `1000390830.jpg`, navigator `1000390828.jpg`, Save & Exit `1000390832.jpg`, detailed results `image(20261011-222100).png`.
- MedSindh question/explanation `image(20261011-211813).png`, `image(20261011-211831).png`, results `image(20261011-222121).png`.
- Owner's most recent screenshot in chat: textured circular accuracy and four colored summary cards. **Use component layout/appearance only, not its surrounding background, header, or button icons.**

The owner has explicitly authorized beginning Phase 4 work. That approval is **not authorization to release production or change the production database**.
