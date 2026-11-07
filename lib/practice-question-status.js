'use strict';

// Pure verification/classification of authenticated, immutable attempt_items.
// Rows MUST arrive newest attempt_id first; older summary-only attempts do not
// have attempt_items and cannot be reconstructed or guessed.
function buildQuestionStatus(attemptRows, bookmarkRows) {
  if (!Array.isArray(attemptRows) || !Array.isArray(bookmarkRows))
    throw new Error('Incomplete question-status history');
  const latest = new Map();
  let precedingAttempt = Number.MAX_SAFE_INTEGER;
  for (const item of attemptRows) {
    const id = Number(item.mcq_id);
    const attempt = Number(item.attempt_id);
    if (!Number.isSafeInteger(id) || id <= 0 ||
        !Number.isSafeInteger(attempt) || attempt <= 0 ||
        attempt > precedingAttempt) throw new Error('Unverified question history ordering');
    precedingAttempt = attempt;
    if (item.selected_index !== null &&
        (!Number.isInteger(item.selected_index) ||
         item.selected_index < 0 || item.selected_index > 3))
      throw new Error('Unverified historical answer');
    if (typeof item.is_correct !== 'boolean' ||
        (item.selected_index === null && item.is_correct))
      throw new Error('Unverified historical grade');
    if (!latest.has(id)) {
      latest.set(id, item.selected_index === null ? 'skipped'
        : item.is_correct ? 'correct' : 'incorrect');
    }
  }
  const marked = new Set();
  for (const row of bookmarkRows) {
    const id = Number(row.mcq_id);
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new Error('Unverified bookmark');
    marked.add(id);
  }
  return { latest: Array.from(latest.entries()), marked: Array.from(marked) };
}

module.exports = { buildQuestionStatus };
