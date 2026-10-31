# Phase 4 SPA examination workspace — Stage 2 staging preview

**Scope:** A first responsive exam interface running dynamically inside `index.html`, in the existing SJN layout, without navigating to `quiz.html`. **Staging-only, opt-in while incomplete.**

**How to preview:** Open the existing staging portal at `/index.html?sjnPhase4Preview=1`, log in as a staging student, configure the existing Create Test wizard, and click **Start MCQs Practice**. The URL updates to `/quiz/session?sjnPhase4Preview=1` with History API *without a full document navigation*. Remove `?sjnPhase4Preview=1` to keep the original question interface.

**Included:** Focused workspace hiding dashboard sidebar/header/footer; compact mobile top bar (Exit icon, Tutor/Timed, progress, red timer, navigator, red Submit), original red subject badge and yellow source badge, plain chapter/topic text with natural wrapping, neutral A/B/C/D chips, right-side navigator (desktop open default; mobile drawer), immediate locked Tutor answers and explanation/mnemonic, Timed selections without early correctness, per-mode navigator statuses, Next/Previous and unanswered-only submit confirmation. This preview uses the **same original selected MCQ list** and existing authenticated submission endpoint.

**Deliberate temporary limits:** This stage does **not** persist drafts or make Save & Exit work; the Exit dialog explicitly warns **Exit Without Saving**. Browser refresh or direct entry cannot restore a preview attempt: route safely falls back to creating a new test after verified login. Mark for Review delegates to the current authenticated bookmark endpoint; because the staging database has **zero published MCQs**, marks cannot be saved until the next authorized question-identity/persistence stage. Full new results page, Review, Retake, correct Saved Tests history and permanent SPA routing are **not implemented** in this stage. Do not present the preview as completed Phase 4 or enable it as the ordinary student flow.

**Why opt-in:** Prevent accidental regressions to current students, until durable Save & Exit, question-level history and account-isolated resumption are implemented and verified. The preview should be used only with staging test accounts/data.

**Acceptance checks:** GitHub CI including original MCQ fingerprint; staging deployment at the exact commit SHA; desktop and mobile owner visual checks; no production or production Supabase change. Keep review data local-only until the persistence stage. Do not label manual tests PASS until the owner confirms them.
