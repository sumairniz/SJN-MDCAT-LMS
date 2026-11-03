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

const DEFAULT_MODEL = 'gemini-3.8-flash';
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
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), 23000);
    try {
      const model = selectedModel();
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
        encodeURIComponent(model) + ':generateContent';
      const upstream = await fetch(url, {
        method: 'POST',
        signal: timeout.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
          contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.55, maxOutputTokens: 1100 }
        })
      });
      if (upstream.status === 429) {
        return res.status(429).json({ error: 'SJN AI Tutor has reached its free usage limit. Please try again later.' });
      }
      if (!upstream.ok) {
        // No provider error bodies are reflected to the client: they may contain
        // account, key, or billing-related details.
        return res.status(503).json({ error: 'The AI provider is temporarily unavailable. Please try again later.' });
      }
      const payload = await upstream.json();
      const answer = readGeminiText(payload);
      if (!answer) return res.status(502).json({ error: 'The tutor could not complete this answer. Please try rephrasing.' });
      return res.json({ answer: answer.slice(0, 9000) });
    } catch (error) {
      return res.status(503).json({ error: timeout.signal.aborted ?
        'The answer took too long. Please try a shorter question.' :
        'The tutor is temporarily unavailable. Please try again.' });
    } finally {
      clearTimeout(timer);
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
