# SJN MedNest Academy — SJN AI Tutor v1 Handover
**Date:** 2026-11-03 (Pakistan)
**Branch:** \`sjn-phase1a-foundation\` (Preview ONLY)
**Status:** CODE BUILT / LIVE PROVIDER UNCONFIGURED / OWNER UAT PENDING

## Owner scope and approval
Owner asked for a personal MDCAT-focused, friendly, motivating and textbook-aware AI without uploading any scanned textbooks, using an AI API **free tier only**, with modern desktop/mobile chat, voice-to-text, and a single consistent name **SJN AI Tutor**. Owner specifically approved a tightly isolated feature that must not harm MCQs, exams, Test History, My Courses, Past Papers, Academy Resources or app performance; if not practical/reliable, disable or remove. Target: complete quickly before 2026-11-09 launch-preparation goals. There is **no authorization to modify Production or enable paid billing**.

## Implemented in GitHub
- \`lib/ai-tutor.js\`: entirely separate optional authenticated API mounted at \`GET /api/ai/status\` and \`POST /api/ai/tutor\` by \`server.js\`. Uses Google Gemini \`generateContent\` via server-side REST only, \`systemInstruction\` with MDCAT teaching approach, textbook-specific fact caution, no fabricated textbook quotes, brief MCQ explanations, Physics workings, personal warmth/motivation. Model override by \`GEMINI_MODEL\`, default \`gemini-3.8-flash\`. API key read ONLY from server environment. No model key in browser. Feature kill switch: \`SJN_AI_ENABLED=0\` stops AI backend even if the key exists.
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
