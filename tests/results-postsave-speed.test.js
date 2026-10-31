'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const results = fs.readFileSync(path.join(__dirname, '..', 'public', 'sjn-phase4-results.js'), 'utf8');
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

const submitSource = (() => {
  const start = html.indexOf('    const originalFinishQuiz = window.finishQuiz;');
  const end = html.indexOf('\n    window.sendAiDoubt = ', start);
  assert.ok(start >= 0 && end > start, 'Must exercise the actual final submission bridge');
  return html.slice(start, end);
})();

function harness() {
  const submit = deferred(), stats = deferred(), history = deferred();
  const calls = { submit: 0, stats: [], history: 0, warnings: [], alerts: [], invalidations: 0, forgets: 0, oldFinish: 0, generation: 0 };
  const els = new Map();
  const window = {
    finishQuiz() { calls.oldFinish++; },
    SJNPracticeFilters: {
      resetSelection() {},
      invalidate() { calls.invalidations++; }
    },
    SJNExamRecovery: { forget() { calls.forgets++; } }
  };
  const ctx = {
    window,
    authToken: 'verified-session',
    currentUser: { id: 'student-a' },
    currentQuizList: [{ id: 4, revisionId: 18 }],
    userAnswers: [1],
    wizardSelection: { selectedSubjects: ['Biology'], selectedChapters: ['Biomolecules'], selectedTopics: [], testMode: 'tutor', subject: 'Biology', bank: 'Past Papers Question Bank' },
    currentSubmissionKey: 'f4221f8c-1122-4f6c-8a22-a65b5a0d1255',
    historyRetakeTitle: null,
    paperSourceFilter: null,
    currentQuizStartedAt: Date.now() - 6000,
    savedAttemptOutcome: null,
    wizardQuestionFiltersActive: false,
    document: { getElementById(id) { if (!els.has(id)) els.set(id, { innerText: '' }); return els.get(id); } },
    api(url) {
      if (url === '/practice/submit') { calls.submit++; return submit.promise; }
      throw new Error('Unexpected API call: ' + url);
    },
    refreshAuthenticatedStats(...args) { calls.stats.push(args); return stats.promise; },
    loadStudentHistory() { calls.history++; return history.promise; },
    console: { warn(...args) { calls.warnings.push(args.map(String).join(' ')); } },
    alert(msg) { calls.alerts.push(msg); },
    Date, Number, Math, Promise
  };
  vm.runInNewContext(
    'let historyGeneration = 0;\n' +
    'function markStudentHistoryChanged(){ historyGeneration++; }\n' +
    submitSource + '\nthis.getHistoryGeneration = () => historyGeneration;',
    ctx
  );
  return { ctx, calls, submit, stats, history, els };
}
const confirmed = { saved: true, id: 543, total: 1, correct: 1, incorrect: 0, skipped: 0, accuracy: 100 };

test('Results stay pending before atomic save but unlock when it confirms, even if stats/history are stalled', async () => {
  const x = harness();
  let finished = false;
  const answer = x.ctx.window.finishQuiz({elapsedSeconds: 3}).then(value => { finished = true; return value; });
  assert.equal(x.calls.submit, 1);
  assert.equal(x.calls.history, 0, 'No history read before authoritative save');
  assert.equal(x.ctx.savedAttemptOutcome, null);
  await Promise.resolve();
  assert.equal(finished, false, 'Must not claim saved before DB result');
  x.submit.resolve(confirmed);
  const result = await answer; // Do not resolve either auxiliary request.
  assert.equal(finished, true);
  assert.equal(result.saved, true);
  assert.equal(result.id, 543);
  assert.equal(x.calls.history, 1);
  assert.equal(x.calls.stats.length, 1);
  assert.equal(x.calls.stats[0][0], 'student-a');
  assert.equal(x.calls.stats[0][1], 1);
  assert.equal(x.calls.generation, 0);
  assert.equal(x.calls.forgets, 1);
  assert.equal(x.calls.invalidations, 1);
  assert.equal(x.els.get('res-correct').innerText, 1);
  assert.match(results, /Promise\.resolve\(savePromise\)\.then\(outcome =>/);
  assert.match(results, /pendingSave = false;[\s\S]*?'sjn-results-dashboard'\)\.disabled = false/);
  x.stats.resolve(true); x.history.resolve(true);
  await Promise.resolve();
});

test('Double-submit guard returns pending while request active and reuses confirmed result afterward', async () => {
  const x = harness();
  const first = x.ctx.window.finishQuiz({elapsedSeconds: 2});
  const second = await x.ctx.window.finishQuiz({elapsedSeconds: 2});
  assert.equal(second.pending, true);
  assert.equal(x.calls.submit, 1);
  x.submit.resolve(confirmed);
  assert.equal((await first).saved, true);
  const repeated = await x.ctx.window.finishQuiz({elapsedSeconds: 2});
  assert.equal(repeated.id, 543);
  assert.equal(x.calls.submit, 1);
  assert.equal(x.calls.oldFinish, 1);
  x.stats.resolve(true); x.history.resolve(true);
  await Promise.resolve();
});

test('Missing secure confirmation does not unlock saved Review/Retake and does not start success refresh', async () => {
  const x = harness();
  const first = x.ctx.window.finishQuiz({elapsedSeconds: 2});
  x.submit.resolve({saved: false});
  // Failure handler runs after the rejected confirmation path is processed.
  // Resolve the independent fallback reads before awaiting the complete result.
  x.stats.resolve(true); x.history.resolve(true);
  assert.equal((await first).saved, false);
  assert.equal(x.ctx.savedAttemptOutcome, null);
  assert.equal(x.calls.alerts.length, 1);
  assert.equal(x.calls.history, 1);
  assert.equal(x.ctx.savedAttemptOutcome, null);
  assert.equal(x.calls.invalidations, 0);
});

test('Account switch during in-flight submission cannot attach saved result or refresh a foreign history', async () => {
  const x = harness();
  const first = x.ctx.window.finishQuiz({elapsedSeconds: 2});
  x.ctx.currentUser = { id: 'student-b' };
  x.submit.resolve(confirmed);
  assert.equal((await first).saved, false);
  assert.equal(x.ctx.savedAttemptOutcome, null);
  assert.equal(x.calls.history, 0);
  assert.equal(x.calls.stats.length, 0);
  assert.equal(x.calls.alerts.length, 1);
});

test('Older /me response is rejected after another confirmed attempt increments history generation', async () => {
  const start = html.indexOf('    async function refreshAuthenticatedStats(');
  const end = html.indexOf('\n    function countStudyStreak(', start);
  assert.ok(start >= 0 && end > start);
  const status = deferred();
  const calls = [];
  const ctx = {
    currentUser: {id:'student-a'},
    api() {return status.promise;},
    applyAuthenticatedStats(stats) {calls.push(stats);},
    Promise
  };
  vm.runInNewContext('let historyGeneration=3;\n'+html.slice(start,end)+
    '\nthis.updateStats=refreshAuthenticatedStats; this.advanceGeneration=()=>++historyGeneration;',ctx);
  const old = ctx.updateStats('student-a',3);
  ctx.advanceGeneration();
  status.resolve({user:{id:'student-a'},stats:{total:9,correct:8}});
  assert.equal(await old,false);
  assert.equal(calls.length,0,'Old response must not overwrite more recently saved stats');
});
