'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'public/sjn-phase4-preview.js'),'utf8');
const css = fs.readFileSync(path.join(root, 'public/sjn-phase4-preview.css'),'utf8');

test('Stage 2 refinement JavaScript parses and does not change the default preview gate', () => {
  assert.doesNotThrow(() => new vm.Script(js));
  assert.match(js, /sjnPhase4Preview'\) !== '1'/);
  assert.match(js, /const origLaunch = window\.launchGeneratedQuiz/);
});

test('Answered progress is based on answered count and unaffected by current question index', () => {
  const match = js.match(/function calculateAnsweredProgress\(answerList, total\) \{[\s\S]*?\n  \}/);
  assert.ok(match, 'Progress helper should be directly testable');
  const calculate = vm.runInNewContext('(' + match[0] + ')');
  assert.equal(calculate([null, null, null, null],4),0);
  assert.equal(calculate([0, 1, null, null, 2, 3, null, null, null, null],10),40);
  assert.equal(calculate([0,1,2,3,0],5),100);
  assert.equal(calculate([],0),0);
  assert.match(js, /aria-valuetext', completed \+ ' of '/);
  assert.match(css, /\.sjn-exam-progress-fill \{[^}]*#eab308/);
});

test('Timed mode uses yellow selection and Tutor mode retains correct/wrong icons only after checking', () => {
  assert.match(css, /\.sjn-exam-option\.is-selected \{[^}]*#eab308/);
  assert.match(js, /const checked = isTutor && state\.checked\[currentMcqIndex\]/);
  assert.match(js, /if \(checked && \(i === q\.correctIndex \|\| selected\)\)/);
  assert.match(js, /fa-solid fa-check/);
  assert.match(js, /fa-solid fa-xmark/);
  assert.match(js, /if \(isTutor\) state\.checked\[currentMcqIndex\] = true/);
  assert.match(js, /Correct Answer: ' \+ 'ABCD'\[q\.correctIndex\] \+ '\. '/);
  assert.doesNotMatch(js, /Incorrect'\) \+ ' — Correct Answer:/);
});

test('Question metadata and Report control preserve inline styling and no duplicate question total', () => {
  assert.match(js, /class="sjn-exam-meta"/);
  assert.match(js, /class="sjn-exam-chapter"/);
  assert.match(js, /class="sjn-exam-source-row"/);
  assert.match(js, /class="sjn-exam-card-actions"/);
  assert.match(js, /class="sjn-exam-counter" id="sjn-exam-counter"/);
  assert.match(js, /textContent = 'Question ' \+ \(currentMcqIndex \+ 1\);/);
  assert.match(css, /\.sjn-exam-card-top \{ align-items: center/);
});

test('Report form has exactly ten categories, optional details and never falsely saves', () => {
  const categories = js.match(/name="sjn-report-reason" value="/g) || [];
  assert.equal(categories.length,10);
  assert.match(js, /id="sjn-exam-report-details"/);
  assert.match(js, /id="sjn-exam-report-submit"[^>]*disabled/);
  assert.match(js, /reportSubmit\.disabled = !reportForm\.querySelector/);
  assert.match(js, /Nothing has been sent or saved/);
  assert.doesNotMatch(js, /fetch\([^\n]*report/);
  assert.match(css, /max-height: 89dvh/);
});

test('Stage 2 remains a visual preview; durable progress is still not claimed', () => {
  assert.match(js, /Save & Exit is not yet available in this staged preview/);
  assert.match(js, /window\.finishQuiz\(\)/);
  assert.match(js, /window\.addEventListener\('beforeunload'/);
  assert.match(css, /\.sjn-exam-explanation-panel/);
});
