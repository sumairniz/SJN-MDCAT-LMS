'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dashboard = fs.readFileSync(path.join(__dirname, '..', 'public/index.html'), 'utf8');
const start = dashboard.indexOf('    function launchGeneratedQuiz() {');
const end = dashboard.indexOf('\n    function startQuick5Mcqs()', start);
assert.ok(start !== -1 && end > start, 'Original quiz launcher must be present');
const launcher = dashboard.slice(start, end);

function createQuizContext(mode = 'timed', bank = [{id: 1, revisionId: 4, bank: 'Past Papers Question Bank', subject: 'Biology'}]) {
  const calls = { module: [], render: 0, timer: [], alerts: [], elements: {} };
  const nodes = new Map();
  function element(id) {
    if (!nodes.has(id)) {
      nodes.set(id, {
        classList: { add() {}, remove() {} },
        innerText: '', id
      });
    }
    return nodes.get(id);
  }
  const ctx = vm.createContext({
    Date, Number, Math,
    mcqQuestionBank: bank,
    wizardSelection: { mcqCount: 1, testMode: mode },
    getFilteredQuestionPool() { return ctx.mcqQuestionBank; },
    shuffleArray(items) { return items.slice(); },
    window: { crypto: { randomUUID: () => 'c1838a32-d04b-432a-a546-189794517afa' } },
    document: { getElementById: element },
    switchModule(name) { calls.module.push(name); },
    renderCurrentQuestion() { calls.render++; },
    startTimer(time) { calls.timer.push(time); },
    alert(message) { calls.alerts.push(message); }
  });
  vm.runInContext(
    'let currentQuizList = []; let currentMcqIndex = -1; let userAnswers = []; ' +
    'let currentSubmissionKey = null; let currentQuizStartedAt = null; ' +
    'let savedAttemptOutcome = { saved: true, id: 12 };\n' + launcher,
    ctx, { timeout: 1000 }
  );
  return { ctx, calls, nodes };
}

test('Timed Mode Start MCQs Practice works without auth-IIFE private variables', () => {
  const { ctx, calls, nodes } = createQuizContext();
  // The auth IIFE's remoteContentLoaded is intentionally NOT defined here.
  vm.runInContext('launchGeneratedQuiz()', ctx, { timeout: 1000 });
  assert.deepEqual(calls.alerts, []);
  assert.deepEqual(calls.module, ['quiz']);
  assert.deepEqual(calls.timer, [60]);
  assert.equal(calls.render, 1);
  assert.equal(nodes.get('submit-answer-btn').innerText, 'Submit Full Exam');
  const state = vm.runInContext('({ length: currentQuizList.length, selected: userAnswers[0], key: currentSubmissionKey, saved: savedAttemptOutcome })', ctx);
  assert.equal(state.length, 1);
  assert.equal(state.selected, null);
  assert.equal(state.key, 'c1838a32-d04b-432a-a546-189794517afa');
  assert.equal(state.saved, null, 'A new test must discard the previous saved outcome');
});

test('Tutor Mode also opens and resets the shared saved-outcome state', () => {
  const { ctx, calls, nodes } = createQuizContext('tutor');
  vm.runInContext('launchGeneratedQuiz()', ctx, { timeout: 1000 });
  assert.deepEqual(calls.module, ['quiz']);
  assert.deepEqual(calls.timer, []);
  assert.equal(calls.render, 1);
  assert.equal(nodes.get('submit-answer-btn').innerText, 'Check Answer');
  assert.equal(vm.runInContext('savedAttemptOutcome', ctx), null);
});

test('Unavailable and unversioned banks refuse to start a test safely', () => {
  for (const bank of [[], [{ id: 1, revisionId: null }], [{ id: 1, revisionId: 0 }]]) {
    const { ctx, calls } = createQuizContext('timed', bank);
    vm.runInContext('launchGeneratedQuiz()', ctx, { timeout: 1000 });
    assert.equal(calls.alerts.length, 1, 'Explain why practice is unavailable');
    assert.deepEqual(calls.module, []);
    assert.deepEqual(calls.timer, []);
  }
});

test('Global launcher must not access auth-private loader state or keep private result cache', () => {
  assert.doesNotMatch(launcher, /\bremoteContentLoaded\b/);
  assert.match(launcher, /!mcqQuestionBank\.length/);
  const declarations = dashboard.match(/\blet savedAttemptOutcome = null;/g) || [];
  assert.equal(declarations.length, 1, 'One shared state used by global launcher and saving logic');
  assert.match(dashboard, /savedAttemptOutcome = null;\s*currentQuizStartedAt = Date\.now\(\);/);
});
