'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'..');
const results = fs.readFileSync(path.join(root,'public/sjn-phase4-results.js'),'utf8');
const exam = fs.readFileSync(path.join(root,'public/sjn-phase4-preview.js'),'utf8');
const history = fs.readFileSync(path.join(root,'public/sjn-history.js'),'utf8');
const html = fs.readFileSync(path.join(root,'public/index.html'),'utf8');

test('Results actions keep approved presentation and parse cleanly',()=>{
  assert.doesNotThrow(()=>new vm.Script(results));
  assert.doesNotThrow(()=>new vm.Script(exam));
  assert.match(results,/id="sjn-results-review" disabled/);
  assert.match(results,/id="sjn-results-retake" disabled/);
  assert.doesNotMatch(results,/will be available after secure question-level attempt history is implemented/);
  assert.match(results,/id="sjn-results-insights"/);
  assert.match(results,/Practice Test Completed!/);
});
test('Results actions require server-confirmed student-owned saved detail',()=>{
  assert.match(results,/verifiedAttemptId = confirmed \? outcome\.id : null/);
  assert.match(results,/Number\.isSafeInteger\(outcome\.id\)/);
  assert.match(results,/window\.SJNHistoryFetchAttempt\(attemptId\)/);
  assert.match(results,/payload\.reviewAvailable !== true \|\| payload\.retakeAvailable !== true/);
  assert.match(results,/payload\.items\.length !== Number\(payload\.attempt\.total\)/);
  assert.match(results,/version !== showVersion/);
  assert.match(results,/window\.SJNPhase4Exam\.reviewSavedAttempt\(payload\)/);
  assert.match(results,/await window\.SJNHistoryLaunchRetake\(payload\)/);
  assert.match(results,/window\.SJNPhase4Exam\?\.isOpen\?\.\(\) !== true/);
});
test('Review reuses unchanged original exam and freezes answers and timer',()=>{
  assert.match(exam,/window\.SJNPhase4Exam = \{/);
  assert.match(exam,/reviewSavedAttempt\(payload\)/);
  assert.match(exam,/state\.reviewOnly = review/);
  assert.match(exam,/state\.checked = Array\(currentQuizList\.length\)\.fill\(review\)/);
  assert.match(exam,/const checked = state\.reviewOnly \|\|/);
  assert.match(exam,/if \(checked \|\| state\.reviewOnly\) return/);
  assert.match(exam,/if \(review\) \{\s*stopClock\(\)/);
  assert.match(exam,/if \(state\.reviewOnly\) \{ returnFromReview\(\); return; \}/);
  assert.match(exam,/window\.SJNPhase4Results\?\.restoreAfterReview\(\)/);
  assert.match(exam,/payload\.items\.filter\(item => item\.isCorrect\)\.length !== Number\(payload\.attempt\.correct\)/);
  assert.match(exam,/new Set\(questions\.map\(q => q\.id\)\)\.size !== questions\.length/);
});
test('Test History Review remains independent and exact-order Retake is reused',()=>{
  assert.match(history,/showDetail\(payload,mode\)/);
  assert.match(history,/window\.SJNHistoryLaunchRetake\(payload\)/);
  assert.match(html,/window\.launchGeneratedQuiz\(questions\)/);
  assert.match(html,/currentQuizList = retaking \? pool\.slice\(\) : shuffleArray\(pool\)/);
  assert.match(exam,/if \(state\.open\) return;\s*origLaunch\.apply\(this, args\)/);
});
