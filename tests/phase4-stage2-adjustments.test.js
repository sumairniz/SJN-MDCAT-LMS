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
  assert.match(js, /const checked = state\.reviewOnly \|\| \(isTutor && state\.checked\[currentMcqIndex\]\)/);
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
  assert.match(js, /window\.finishQuiz\(\{ elapsedSeconds: snapshot\.elapsedSeconds \}\)/);
  assert.match(js, /window\.addEventListener\('beforeunload'/);
  assert.match(css, /\.sjn-exam-explanation-panel/);
});

test('Last question switches Next to red Finish and reuses Submit confirmation', () => {
  const helper = js.match(/function isLastQuestion\(index, total\) \{[\s\S]*?\n  \}/);
  assert.ok(helper, 'Last-question function should be testable');
  const isLastQuestion = vm.runInNewContext('(' + helper[0] + ')');
  assert.equal(isLastQuestion(0, 0), false);
  assert.equal(isLastQuestion(0, 1), true);
  assert.equal(isLastQuestion(8, 10), false);
  assert.equal(isLastQuestion(9, 10), true);
  assert.match(js, /id="sjn-exam-next-label">Next<\/span>/);
  assert.match(js, /finalQuestion \? 'Finish' : 'Next'/);
  assert.match(js, /nextButton\.classList\.toggle\('is-finish', finalQuestion\)/);
  assert.match(js, /nextButton\.disabled = false/);
  assert.match(js, /if \(isLastQuestion\(currentMcqIndex, currentQuizList\.length\)\) requestSubmission\(\)/);
  assert.match(js, /\$\('sjn-exam-submit'\)\.addEventListener\('click', requestSubmission\)/);
  assert.match(css, /\.sjn-exam-next\.is-finish \{[^}]*background: #dc2626/);
  assert.match(js, /Review Unanswered/);
  assert.match(js, /Submit Anyway/);
  assert.match(js, /Submit Test', run: completeTest/);
});

test('Desktop outlined controls stay icon-only on mobile; scrollbar is thin and scoped', () => {
  assert.match(css, /\.sjn-exam-mark,\.sjn-exam-report-trigger \{[^}]*border: 1px solid #414148; border-radius: 8px/);
  assert.match(css, /\.sjn-exam-mark,\.sjn-exam-report-trigger \{[^}]*min-width: 33px;[^}]*border: 0;/);
  assert.match(css, /\.sjn-exam-mark span,\.sjn-exam-report-trigger span \{ display: none; \}/);
  assert.match(css, /scrollbar-width: thin;/);
  assert.match(css, /\.sjn-exam-navigator::-webkit-scrollbar,[^}]*width: 3px; height: 3px;/);
  assert.doesNotMatch(css, /::-webkit-scrollbar \{ width: auto;/);
});


test('Navigator numbered tiles compact responsively without resizing the panel', () => {
  // auto-fill retains compact empty tracks when a test contains very few MCQs.
  assert.match(css, /\.sjn-exam-number-grid \{ display: grid; grid-template-columns: repeat\(auto-fill,minmax\(28px,1fr\)\); gap: 5px; \}/);
  assert.match(css, /\.sjn-exam-number \{ aspect-ratio: 1; min-height: 30px; border-radius: 7px;/);
  assert.doesNotMatch(css, /grid-template-columns: repeat\(5,minmax\(0,1fr\)\)/);
  // Keep the existing desktop sticky height limit, width determined by layout, and scrolling.
  assert.match(css, /\.sjn-exam-layout \{ display: grid; grid-template-columns: minmax\(0,1fr\) minmax\(236px,280px\);/);
  assert.match(css, /\.sjn-exam-navigator \{ padding: 17px; position: sticky; top: 14px; max-height: calc\(100vh - 75px\); overflow-y: auto; \}/);
  // The pre-existing mobile drawer keeps its dimensions, with larger touch-friendly tiles.
  assert.match(css, /width: min\(330px,88vw\); max-height: none;/);
  assert.match(css, /\.sjn-exam-number-grid \{ grid-template-columns: repeat\(auto-fill,minmax\(40px,1fr\)\); gap: 6px; \}/);
  assert.match(css, /\.sjn-exam-number \{ min-height: 40px; \}/);
  assert.match(js, /button\.addEventListener\('click', \(\) => goTo\(i\)\)/);
  assert.match(css, /\.sjn-exam-number\.is-marked::after/);
});
