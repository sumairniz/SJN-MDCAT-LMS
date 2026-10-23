'use strict';

// Permanent input boundary shared by authenticated server endpoints/tests.
// Never accept a browser-supplied score or answer key for grading.
const MAX_QUESTIONS = 200;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validText(value, maximum) {
  return typeof value === 'string' && value.trim().length > 0 &&
    value.trim().length <= maximum && !/[\u0000-\u0008\u000b-\u001f]/.test(value);
}

function validatePracticeSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const fields = ['submissionKey', 'items', 'title', 'mode', 'subject', 'selection', 'elapsedSeconds'];
  if (Object.keys(body).some(key => !fields.includes(key))) return null;
  if (typeof body.submissionKey !== 'string' || !UUID_V4.test(body.submissionKey)) return null;
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > MAX_QUESTIONS) return null;
  if (!validText(body.title, 120) || !validText(body.subject, 100)) return null;
  if (body.mode !== 'tutor' && body.mode !== 'timed') return null;
  if (!body.selection || typeof body.selection !== 'object' ||
      Array.isArray(body.selection) || JSON.stringify(body.selection).length > 8192) return null;
  if (!Number.isSafeInteger(body.elapsedSeconds) ||
      body.elapsedSeconds < 0 || body.elapsedSeconds > 86400) return null;

  const ids = new Set();
  const items = [];
  for (const item of body.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    if (Object.keys(item).sort().join(',') !== 'mcqId,revisionId,selectedIndex') return null;
    if (!Number.isSafeInteger(item.mcqId) || item.mcqId <= 0 ||
        !Number.isSafeInteger(item.revisionId) || item.revisionId <= 0 ||
        !(item.selectedIndex === null ||
          (Number.isInteger(item.selectedIndex) && item.selectedIndex >= 0 && item.selectedIndex <= 3)) ||
        ids.has(item.mcqId)) return null;
    ids.add(item.mcqId);
    items.push({ mcqId: item.mcqId, revisionId: item.revisionId,
      selectedIndex: item.selectedIndex });
  }
  return {
    submissionKey: body.submissionKey.toLowerCase(),
    items, title: body.title.trim(), mode: body.mode,
    subject: body.subject.trim(), selection: body.selection,
    elapsedSeconds: body.elapsedSeconds
  };
}

module.exports = { validatePracticeSubmission, MAX_QUESTIONS };
