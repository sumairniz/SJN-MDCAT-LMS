'use strict';

// Isolated, removable AI Tutor integration. Only registered under /api/ai/*.
// No Supabase tables, exam endpoints, student profiles, or MCQ APIs are touched.
const SYSTEM_INSTRUCTIONS = [
  'You are SJN AI Tutor, the friendly academic study companion of SJN MedNest Academy in Pakistan.',
  'Your audience is MDCAT/NUMS medical entrance examination students studying Biology, Chemistry, Physics, English and Logical Reasoning.',
  'Be accurate, warm, clear, encouraging when appropriate, and concise by default. Teach rather than merely provide answers.',
  'For an MCQ: state the best answer and explain why, briefly addressing plausible distractors. For Physics: use formulas, substitutions, units and clear steps.',
  'MDCAT answers can be textbook- or board-dependent. Distinguish well-established concepts from memorized textbook-specific values, percentages, dates, named lists and classifications.',
  'When an exact fact may differ across Sindh (STB), Punjab (PTB), Federal (FTB), KP or other Pakistani textbooks, say that it may vary and advise the student to verify it in their prescribed board textbook. Do NOT add that warning to every general concept.',
  'Never invent textbook quotations, exact page numbers, official answer keys, percentages, or claim to have checked a specific textbook you have not accessed.',
  'If general modern scientific information differs from simplified exam material, explain the difference cautiously and make the relevant textbook requirement clear. Do not invent what any board textbook states.',
  'If the student corrects an error or disputes a key, re-evaluate instead of defending a possibly wrong answer.',
  'Sound like an approachable, focused academy tutor, not a generic AI marketing bot. Do not repeatedly greet, overuse emojis, or mechanically motivate in every answer.',
  'Speak in the language the student uses, but give standard English scientific terms where helpful. No religious or personal assumptions about students.',
  'When a student feels discouraged, give brief actionable encouragement. Avoid exaggerated promises about results.',
  'Do not claim to know a student personally, their marks, health, exam performance, or personal records. No access to student records or uploaded textbooks is provided.',
  'If asked about medical conditions, offer general educational information rather than diagnosis. If self-harm or emergencies arise, direct to appropriate immediate help.',
  'Keep responses useful for studying. Prefer short sections or numbered steps when the problem calls for them.'
].join('\n');

// Verified free-tier stable model; override only after checking the project's tier.
const DEFAULT_MODEL = 'gemini-3.6-flash';
// This protects a small preview cohort. A serverless instance is not shared
// between all deployments; Google free-tier quotas remain the final hard cap.
const perInstanceUsage = new Map();
const inflight = new Set();
const DAILY_REQUEST_LIMIT = 15;
const MIN_GAP_MS = 9000;
const MAX_INPUT_LENGTH = 2200;

function isEnabled() {
  return process.env.SJN_AI_ENABLED !== '0' && process.env.SJN_AI_ENABLED !== 'false';
}
function isConfigured() {
  return isEnabled() && Boolean(process.env.GEMINI_API_KEY?.trim());
}
function selectedModel() {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  return /^[a-z][a-z0-9.-]{2,64}$/.test(model) ? model : DEFAULT_MODEL;
}
function validHistory(input) {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > 12) return null;
  const result = [];
  for (const item of input.slice(-8)) {
    if (!item || !['user', 'model'].includes(item.role) || typeof item.text !== 'string' ||
        !item.text.trim() || item.text.length > 3400) return null;
    result.push({ role: item.role, parts: [{ text: item.text.trim() }] });
  }
  return result;
}
function quotaCheck(userId) {
  const day = new Date().toISOString().slice(0, 10);
  const key = userId + ':' + day;
  const now = Date.now();
  if (inflight.has(userId)) return { error: 'Please wait for the previous response.', status: 429 };
  let record = perInstanceUsage.get(key);
  if (!record) record = { count: 0, last: 0 };
  if (record.count >= DAILY_REQUEST_LIMIT) {
    return { error: 'Your AI Tutor practice limit for today has been reached. Please return tomorrow.', status: 429 };
  }
  if (now - record.last < MIN_GAP_MS) {
    return { error: 'Please allow a few seconds between questions.', status: 429 };
  }
  if (perInstanceUsage.size > 2500) {
    for (const oldKey of perInstanceUsage.keys()) {
      if (!oldKey.endsWith(':' + day)) perInstanceUsage.delete(oldKey);
    }
  }
  record.count++;
  record.last = now;
  perInstanceUsage.set(key, record);
  inflight.add(userId);
  return null;
}
// Unsuccessful provider responses should not consume the tutor's per-instance
// daily successful-answer allowance. Keep last-request time to deter spam.
function refundFailedUse(userId) {
  const key = userId + ':' + new Date().toISOString().slice(0, 10);
  const record = perInstanceUsage.get(key);
  if (record) record.count = Math.max(0, record.count - 1);
}
function readGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts) ? parts.map(p => typeof p.text === 'string' ? p.text : '').join('\n').trim() : '';
}
function registerAiTutorRoutes(app, auth) {
  app.get('/api/ai/status', auth, (req, res) => {
    res.set('Cache-Control', 'no-store');
    return res.json({
      available: isConfigured(),
      enabled: isEnabled(),
      service: 'SJN AI Tutor',
      message: !isEnabled() ? 'SJN AI Tutor is temporarily unavailable.' :
        !isConfigured() ? 'AI Tutor setup is pending. No questions will be sent to an AI provider.' :
        'SJN AI Tutor is ready for a practice question.',
      // Do not expose API key, model credentials, user records, or provider billing.
      maxInputLength: MAX_INPUT_LENGTH
    });
  });

  app.post('/api/ai/tutor', auth, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!isConfigured()) {
      return res.status(503).json({ error: 'SJN AI Tutor is not available yet. The rest of your LMS is unaffected.' });
    }
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt || prompt.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ error: 'Please enter a question of 1–2,200 characters.' });
    }
    const history = validHistory(req.body?.history);
    if (!history) return res.status(400).json({ error: 'Invalid conversation context.' });
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Sign in to ask a question.' });
    const limited = quotaCheck(userId);
    if (limited) return res.status(limited.status).json({ error: limited.error });
    const model = selectedModel();
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(model) + ':generateContent';
    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.55, maxOutputTokens: 2000 }
    });
    let completed = false;
    try {
      // Google's API can intermittently return 503 on overload. One bounded
      // retry for 5xx/network failure is permitted; NEVER retry 429 quota
      // errors, configuration errors, or a timed-out generation automatically.
      for (let attempt = 1; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        let upstream;
        const started = Date.now();
        try {
          upstream = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': process.env.GEMINI_API_KEY
            },
            body: payload
          });
        } catch (error) {
          const timedOut = controller.signal.aborted;
          // No input text, key, authorization headers, or provider response
          // content in logs. These fields only reveal safe failure categories.
          console.warn('[AI Tutor] provider request failed', {
            type: timedOut ? 'timeout' : 'network',
            attempt,
            elapsedMs: Date.now() - started
          });
          if (!timedOut && attempt === 1) {
            await new Promise(resolve => setTimeout(resolve, 700));
            continue;
          }
          return res.status(503).json({
            error: timedOut ?
              'The answer took too long. Please try again in a moment.' :
              'A connection problem interrupted the AI Tutor. Please try again shortly.'
          });
        } finally {
          clearTimeout(timer);
        }

        if (upstream.status === 429) {
          console.warn('[AI Tutor] provider rate limit', { status: 429, attempt });
          res.set('Retry-After', '45');
          return res.status(429).json({
            error: 'Gemini has temporarily reached a free-tier request or token limit. Please try later; your other LMS features are working normally.'
          });
        }

        if (!upstream.ok) {
          const code = upstream.status;
          // HTTP status, not the provider's raw body, is enough to separate
          // transient failures from account/model setup errors safely.
          console.warn('[AI Tutor] provider rejected request', {
            status: code,
            attempt,
            elapsedMs: Date.now() - started
          });
          if ([500, 502, 503, 504].includes(code) && attempt === 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
            continue;
          }
          if (code === 401 || code === 403) {
            return res.status(503).json({
              error: 'The AI Tutor API key or project access needs attention. Please inform the academy administrator.'
            });
          }
          if (code === 404) {
            return res.status(503).json({
              error: 'The configured AI model is unavailable. Please inform the academy administrator.'
            });
          }
          if (code === 400 || code === 422) {
            return res.status(400).json({
              error: 'Gemini could not process this question. Please start a new chat or try a shorter question.'
            });
          }
          return res.status(503).json({
            error: 'Gemini is temporarily busy. Please try again shortly.'
          });
        }

        let data;
        try {
          data = await upstream.json();
        } catch (error) {
          console.warn('[AI Tutor] provider returned invalid JSON', { attempt });
          return res.status(502).json({
            error: 'The AI Tutor received an incomplete response. Please try again.'
          });
        }
        const answer = readGeminiText(data);
        if (!answer) {
          const finishReason = data?.candidates?.[0]?.finishReason;
          console.warn('[AI Tutor] empty completion', {
            finishReason: typeof finishReason === 'string' ? finishReason : 'unknown'
          });
          return res.status(502).json({
            error: 'The tutor could not finish this answer. Try a shorter question or start a new chat.'
          });
        }
        completed = true;
        return res.json({ answer: answer.slice(0, 9000) });
      }
      return res.status(503).json({ error: 'Gemini is temporarily busy. Please try again shortly.' });
    } finally {
      if (!completed) refundFailedUse(userId);
      inflight.delete(userId);
    }
  });
}

module.exports = {
  registerAiTutorRoutes,
  validHistory,
  readGeminiText,
  selectedModel,
  SYSTEM_INSTRUCTIONS
};
