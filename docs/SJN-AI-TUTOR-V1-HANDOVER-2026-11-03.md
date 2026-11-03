# 2026-11-03 — LATEST: AI TUTOR RELIABILITY FIX (OWNER-APPROVED)

**Owner preference:** Existing SJN AI Tutor response personality was praised, specifically neutral academy discussion, natural first-person academy membership, and tactful/non-disclosing ownership response. **Preserve those behaviours**; do not introduce rigid ownership denials or disclose owner identities. Purple UI is not accepted as final, but **UI redesign is postponed until AI reliability is settled**. No changes to UI, Academy Resources, Courses, exam/test/history or Production authorized as part of this fix.

**Reported from actual student-like conversation:** Gemini produced proper educational answers intermittently, with many generic "AI provider is temporarily unavailable" responses between successes. AI also renders raw Markdown and TeX in chat, and can generate long answers; these are known DEFERRED UI/output-formatting tasks, not in scope for current reliability fix.

**Diagnosis:** Earlier `lib/ai-tutor.js` mapped all non-429 provider failures to 503 with the same message; 23-second timeout, no retry, and all failed attempts incremented per-instance daily allowance. Actual external failure code cannot be retroactively identified: existing Vercel Hobby runtime logs did not retain the relevant window, and the shorter checked window returned no records. Therefore **do not claim** the root cause was definitely quota, model selection, or network. Google documents transient 5xx overload; free tier also has 429 quotas.

**Implemented on `sjn-phase1a-foundation`:**
- For Gemini generation calls, one bounded retry (maximum **two total requests**) only for transient network errors and HTTP 500/502/503/504, with short 700–800 ms delay. No automatic retry for 429, bad API key/project, missing model or provider timeout.
- Provider calls have individual 30-second abort limits; safe server-side logging writes only coarse error class, HTTP status, attempt number, elapsed milliseconds or finish reason. No API keys, question text, student identifiers, raw provider bodies, or answer contents are logged.
- Distinct user-safe messages for 429 free-tier limits, 401/403 key/access errors, 404 model unavailable, 400 invalid or overly long input, timeout, network failure, and empty/incomplete reply. Failure outcomes refund the **per-instance daily successful-answer count**, while preserving a short attempt cooldown. Do not claim this is a global durable limiter: Vercel serverless instance memory varies.
- Increased generation output token ceiling from 1100 to 2000 to mitigate prematurely cut explanations. **AI system instructions and response personality unchanged.** No UI changes.
- Added `tests/ai-tutor-reliability.test.js` with mocked network retry / quota / 403 / invalid history coverage.

**Limits:** Provider quotas and overloaded service cannot be eliminated. Google AI Studio may have a lower free request quota than browser Gemini chat; regular chat and API are independent. Backoff/retry may improve transient availability but cannot guarantee reliability. Very long model responses can still truncate at 9000 characters, and raw Markdown/LaTeX remains a separate later UI work item.

**Follow-up validation:** After current Preview deployment passes CI and is READY, owner should send separated questions (at least ~9s apart) and report exact on-screen error for failures. Verify a short Chemistry explanation, brief Roman Urdu question, and a multi-turn Physics discussion; check provider status in AI Studio Rate Limit/Usage when 429 appears. If outages persist, use fresh Vercel Preview runtime logs during failure and classify the exact provider status before any additional fix. Do not use the owner's API key outside Vercel.

**Stage:** AI v1 functioning intermittently, reliability mitigation implemented; NOT FINALIZED. UI/design and rich Markdown/LaTeX formatting remain pending discussion/approval. Keep the rest of LMS unchanged and do not promote to Production.

---

# SJN MedNest Academy — SJN AI Tutor v1 Handover
**Date:** 2026-11-03 (Pakistan)
**Branch:** \`sjn-phase1a-foundation\` (Preview ONLY)
**Status:** CODE BUILT + REGRESSION TESTED / LIVE PROVIDER UNCONFIGURED / OWNER UAT PENDING

## Owner scope and approval
Owner asked for a personal MDCAT-focused, friendly, motivating and textbook-aware AI without uploading any scanned textbooks, using an AI API **free tier only**, with modern desktop/mobile chat, voice-to-text, and a single consistent name **SJN AI Tutor**. Owner specifically approved a tightly isolated feature that must not harm MCQs, exams, Test History, My Courses, Past Papers, Academy Resources or app performance; if not practical/reliable, disable or remove. Target: complete quickly before 2026-11-09 launch-preparation goals. There is **no authorization to modify Production or enable paid billing**.

## Implemented in GitHub
- \`lib/ai-tutor.js\`: entirely separate optional authenticated API mounted at \`GET /api/ai/status\` and \`POST /api/ai/tutor\` by \`server.js\`. Uses Google Gemini \`generateContent\` via server-side REST only, \`systemInstruction\` with MDCAT teaching approach, textbook-specific fact caution, no fabricated textbook quotes, brief MCQ explanations, Physics workings, personal warmth/motivation. Model override by \`GEMINI_MODEL\`, default \`gemini-3.6-flash\`. API key read ONLY from server environment. No model key in browser. The default model has a verified Standard free tier; do not assume a paid account is free. Feature kill switch: \`SJN_AI_ENABLED=0\` stops AI backend even if the key exists.
- Conservative limits: 2,200 chars/question, 8 previous messages max, max 1,100 generated tokens, 23-second timeout, 9-second request gap, 15 requests/student/day **per warm server instance**, in-flight duplicate guard. **Important:** per-instance limit is not global/durable on Vercel serverless; Google free-project quota is the actual provider-wide limit. For high-volume public use, a durable cross-instance rate limiter and abuse controls are needed before broad release. Do not claim this alone prevents charges if a paid-enabled Google API project is used.
- \`public/index.html\`, \`public/sjn-ai-tutor.js\`, \`public/sjn-ai-tutor.css\`: distinct SJN AI Tutor identity in sidebar and chat; polished desktop/mobile interface; optional browser speech-to-text with permission and unsupported-browser fallback; simple prompt chips; conversational text, multiline question composer, New Chat; session-only in-memory conversation context, cleared on logout/account change and not stored in browser storage; no student grades/profiles/question history sent. Uses existing verified auth API bridge, with no impact to modules unless user opens AI section.
- Responses are inserted as text (not untrusted HTML); voice input not auto-sent; no external API key revealed.
- \`tests/ai-tutor.test.js\`: isolated startup/unconfigured API behavior, content policy, history validation, source XSS boundaries, no exam dependencies. Legacy auth and result-harness test boundaries updated solely because obsolete AI handler was removed; NO exam logic changed.
- No Supabase migrations, Cloudflare changes, external writes, production environment changes, or changes to exam engine and related modules.

## CRITICAL outstanding setup blocker
At last read, Vercel Preview \`sjn-phase1a-foundation\` **did not have \`GEMINI_API_KEY\`**; this means **live tutor cannot answer yet**. The developer/assistant cannot generate this Google account credential via current connected tools. Owner needs to create an API key in **Google AI Studio** (\`https://aistudio.google.com/api-keys\`) for a project that is NOT linked to paid billing, confirm the model and free quota, and store it as Vercel **Secret** \`GEMINI_API_KEY\`, target **Preview Branches → sjn-phase1a-foundation only**, not Production; no need to send secret to chat. Owner should verify Google API enabled and quotas on AI Studio. Deployment must be refreshed after adding secret. \`SJN_AI_ENABLED\` is optional; default enabled when key present and not explicitly set to \`0\` or \`false\`. Do not enable paid upgrades or assume API usage comes with ChatGPT Plus.

Google free-tier terms: may use prompts/responses to improve products; inform students, avoid private identifying information. Need owner consent on this tradeoff before broad student rollout.

## UAT after key is connected
1. Verify Preview AI Status ready and send "Explain Newton's second law with a 2 kg numerical"; measure reply.
2. Test textbook-sensitive factual question: "What is the percentage of protein in a cell?" Tutor should note source-specific numerical differences and suggest prescribed board textbook verification, not claim a particular book page.
3. Test Chemistry MCQ with distractors, motivational study planning, 3-turn contextual follow-up.
4. On Android Chrome: responsive chat box/keyboard, New Chat, voice microphone permission and fallback.
5. Confirm quota/error when provider fails, missing key, manual kill switch, no cross-user chat leakage.
6. Regression: MCQ engine, Test History, My Courses, Past Papers, Academy Resources and login still work as before. Record real results and get owner approval before marking AI feature complete.

## Rollback and isolation
- To temporarily disable: set Preview env \`SJN_AI_ENABLED=0\`; backend returns 503 and UI displays unavailable; other LMS modules still operate.
- To remove entirely, revert commits touching \`lib/ai-tutor.js\`, \`public/sjn-ai-tutor.js/.css\`, AI-only HTML section/bridge/script, and dedicated registration call in server. Do not blindly revert unrelated exam code. No schema rollback required because no database changes were made.
- Production untouched. \`vercel.json\` location remains \`bom1\`. No free-tier service guarantee for public traffic.

## Next work after owner's test
Complete configuration and live API verification, adjust only AI prompt/UI if needed with owner approval, close AI stage, then discuss priority deferred features, analytics/mistake diary, Admin Panel, domain and production promotion.
