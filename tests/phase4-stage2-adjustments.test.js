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

test('Owner-approved exam header stays sticky in the scrollable workspace on desktop and mobile', () => {
  const dashboard = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  assert.match(dashboard, /<main id="sjn-workspace-main" class="[^"]*overflow-y-auto/);
  assert.match(js, /<header class="sjn-exam-topbar">[\s\S]*?id="sjn-exam-exit"[\s\S]*?id="sjn-exam-mode"[\s\S]*?id="sjn-exam-clock"[\s\S]*?id="sjn-exam-nav-toggle"[\s\S]*?id="sjn-exam-submit"/);
  const header = css.match(/\.sjn-exam-topbar\s*\{([^}]*)\}/)?.[1];
  assert.ok(header, 'Exam topbar must retain a single scoped CSS rule');
  assert.match(header, /position:\s*sticky;/);
  assert.match(header, /top:\s*0(?:px)?;/);
  assert.match(header, /z-index:\s*40;/);
  assert.doesNotMatch(header, /position:\s*fixed;/);
  // Existing dialogs and mobile drawer stay above the sticky header.
  assert.match(css, /\.sjn-exam-dialog-layer \{[^}]*z-index:\s*95;/);
  assert.match(css, /\.sjn-exam-report-layer \{[^}]*z-index:\s*96;/);
  assert.match(css, /\.sjn-exam-navigator \{[^}]*z-index:\s*90;/);
  // The mobile header retains its approved compact dimensions.
  assert.match(css, /\.sjn-exam-topbar \{ padding: 8px 7px; gap: 5px; min-height: 56px;/);
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

test('Report preview offers eleven independently selectable reasons without falsely saving', () => {
  const categories = js.match(/name="sjn-report-reason" value="/g) || [];
  assert.equal(categories.length,11);
  assert.equal((js.match(/type="checkbox" name="sjn-report-reason"/g)||[]).length,11);
  assert.doesNotMatch(js,/type="radio" name="sjn-report-reason"/);
  assert.match(js,/Select one or more reasons/);
  assert.match(js,/value="out-of-syllabus"/);
  assert.match(js,/Out of Syllabus/);
  assert.match(js,/id="sjn-exam-report-details"/);
  assert.match(js,/id="sjn-exam-report-submit"[^>]*disabled/);
  assert.match(js,/reportSubmit\.disabled = !reportForm\.querySelector/);
  assert.match(js,/Nothing has been sent or saved/);
  assert.doesNotMatch(js,/fetch\([^\n]*report/);
  assert.match(css,/max-height: 89dvh/);
});
test('Mark visual state is immediate with server-confirmed rollback and the existing marked-filter purple',()=>{
  const dashboard=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
  assert.match(dashboard,/--sjn-chip-accent:#a78bfa;--sjn-chip-text:#c4b5fd/);
  assert.match(css,/--sjn-mark-accent: #a78bfa; --sjn-mark-text: #c4b5fd/);
  assert.match(css,/\.sjn-exam-mark\.is-marked \{[^}]*border-color: var\(--sjn-mark-accent\)/);
  assert.match(css,/\.sjn-exam-mark:not\(:disabled\):hover/);
  assert.match(css,/\.sjn-exam-report-trigger:hover/);
  assert.match(js,/const pendingMarkRequests = new Map\(\)/);
  assert.match(js,/pendingMarkRequests\.set\(key, !marked\(q\)\);\s*renderMarkAction\(q\)/);
  assert.match(js,/if \(activeMarkWriters\.has\(key\)\) return/);
  assert.match(js,/await window\.toggleBookmarkCurrentMcq\(q\.id\)/);
  assert.match(js,/finally \{\s*pendingMarkRequests\.delete\(key\)/);
  assert.match(js,/btn\.disabled = false/);
  assert.match(js,/btn\.querySelector\('span'\)\.textContent = label/);
  assert.match(dashboard,/window\.toggleBookmarkCurrentMcq = async function\(mcqId = null\)/);
  assert.match(dashboard,/await api\('\/bookmarks\/toggle'/);
  assert.match(dashboard,/return true;\s*\} catch\(e\)\{alert\(e.message\);return false;/);
  assert.match(css,/min-width: 44px; min-height: 44px/);
  assert.doesNotMatch(js,/fetch\('\/api\/bookmarks\/toggle'/);
});

test('Stage 2 remains a visual preview; durable progress is still not claimed', () => {
  assert.match(js, /Exit Without Saving/);
  assert.match(js, /Save & Exit/);
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
  assert.match(css, /\.sjn-exam-mark,\.sjn-exam-report-trigger \{[^}]*min-width: 33px;[^}]*border: 1px solid transparent;/);
  assert.match(css, /\.sjn-exam-mark\.is-marked \{ border-color: var\(--sjn-mark-accent\); \}/);
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


test('draft exits do not read dashboard-private variables and use independent three-choice colors',()=>{
  assert.doesNotMatch(js,/title:String\(historyRetakeTitle \|\| paperSourceFilter/);
  assert.match(js,/const commonSource = currentQuizList\[0\]\?\.source/);
  assert.match(js,/currentQuizList\.every\(q=>q\.source===commonSource\)/);
  assert.match(js,/title:String\(title\)/);
  assert.match(js,/action\.discard \? 'sjn-exam-dialog-discard'/);
  assert.match(js,/label: 'Exit Without Saving', discard: true/);
  assert.match(js,/label: 'Save & Exit'.*primary: true/);
  assert.match(css,/\.sjn-exam-dialog-discard \{[^}]*background: #39191d/);
  assert.match(css,/\.sjn-exam-dialog-discard:hover/);
  assert.match(js,/answers:reset\?items\.map\(\(\)=>null\):userAnswers\.slice\(\)/);
  assert.match(js,/currentIndex:reset\?0:currentMcqIndex/);
  assert.match(js,/remainingSeconds:wizardSelection\.testMode==='timed'/);
});
