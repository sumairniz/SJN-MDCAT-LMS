'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'..');
const html = fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const css = fs.readFileSync(path.join(root,'public/sjn-history.css'),'utf8');
const js = fs.readFileSync(path.join(root,'public/sjn-history.js'),'utf8');
const server = fs.readFileSync(path.join(root,'server.js'),'utf8');

test('Stage 3B Test History additions parse and do not alter existing quiz workspace styling',()=>{
  assert.doesNotThrow(()=>new vm.Script(js));
  assert.match(html,/id="module-history"/);
  assert.match(html,/sjn-history\.css/);
  assert.match(html,/sjn-history\.js/);
  assert.match(css,/#module-history \.sjn-history-card/);
  assert.doesNotMatch(css,/\.sjn-exam-/);
  assert.doesNotMatch(css,/\.sjn-results-/);
  assert.match(html,/function launchGeneratedQuiz\(preselectedQuestions = null\)/);
  assert.match(html,/if \(!retaking\) historyRetakeTitle = null/);
  assert.match(html,/currentQuizList = retaking \? pool\.slice\(\) : shuffleArray\(pool\)/);
});

test('Desktop and mobile history expose the approved 3 actions and no sideways mobile table',()=>{
  assert.match(html,/id="history-table-body"/);
  assert.match(html,/id="sjn-history-mobile-list"/);
  assert.match(html,/id="sjn-history-total"/);
  assert.match(html,/id="sjn-history-completed"/);
  assert.match(css,/sjn-history-table-wrap\{display:none\}/);
  assert.match(css,/sjn-history-mobile-list\{display:grid/);
  assert.match(css,/sjn-history-card \.sjn-history-actions\{display:grid;grid-template-columns:repeat\(3/);
  assert.match(js,/button\('Results','results'/);
  assert.match(js,/button\('Review','review'/);
  assert.match(js,/button\('Retake','retake'/);
  assert.match(css,/sjn-history-action-results i\{color:#f87171\}/);
  assert.match(css,/sjn-history-action-review\{background:#dc2626/);
});

test('History filters preserve truthful source/status semantics',()=>{
  assert.match(html,/id="sjn-history-search"/);
  assert.match(html,/id="sjn-history-source"/);
  assert.match(html,/id="sjn-history-mode"/);
  assert.match(html,/id="sjn-history-status"/);
  assert.match(html,/id="sjn-history-date"/);
  assert.match(html,/<option value="in-progress">In Progress<\/option>/);
  assert.match(js,/log\.status === 'in-progress'/);
  assert.match(js,/button\('Resume','retake'/);
  assert.match(js,/function sourceOf\(log\)/);
  assert.match(js,/return 'other'/);
  assert.match(js,/log\.detailsVersion !== 1/);
  assert.match(js,/No saved tests match these filters/);
  assert.match(js,/state\.statusFilter === 'in-progress'/);
});

test('Historical answers are account-bound, exact revision-validated and scored by saved DB',()=>{
  assert.match(server,/app\.get\('\/api\/history\/:attemptId', auth/);
  assert.match(server,/\.eq\('user_id', studentId\)\.eq\('id', id\)\.maybeSingle/);
  assert.match(server,/\.eq\('user_id', studentId\)\.eq\('attempt_id', id\)/);
  assert.match(server,/\.from\('mcq_revisions'\)/);
  assert.match(server,/rev\.mcq_id/);
  assert.match(server,/row\.selected_index === rev\.correct_index/);
  assert.match(server,/correct !== attempt\.correct/);
  assert.match(server,/details_version !== 1/);
  assert.match(server,/reviewAvailable: false, retakeAvailable: false/);
  assert.match(js,/payload\.retakeAvailable!==true/);
  assert.match(html,/Number\(q\.revisionId\)!==Number\(item\.revisionId\)/);
  assert.match(html,/new Set\(questions\.map\(q=>q\.id\)\)\.size!==questions\.length/);
  assert.match(html,/window\.launchGeneratedQuiz\(questions\)/);
});

test('Approved review adjustments keep the status fill and violet bookmark separate',()=>{
  assert.match(html,/Past Papers Question Bank<\/option>/);
  assert.match(js,/past:'Past Papers Question Bank'/);
  assert.doesNotMatch(js,/value\.includes\('iba mdcat'\)/);
  assert.match(html,/id="sjn-history-nav-toggle"/);
  assert.match(html,/aria-expanded="true"/);
  assert.match(js,/state\.navigatorVisible=true/);
  assert.match(js,/navigator\.classList\.toggle\('hidden',!state\.navigatorVisible\)/);
  assert.match(js,/item\.marked\?' is-marked':''/);
  assert.match(js,/sjn-history-number-bookmark/);
  assert.match(css,/sjn-history-number\.is-correct\{background:#166534/);
  assert.match(css,/sjn-history-number\.is-incorrect\{background:#991b1b/);
  assert.match(css,/sjn-history-number\.is-unanswered\{background:#a16207/);
  assert.match(css,/sjn-history-number\.is-marked\{border:2px solid #a78bfa/);
  assert.doesNotMatch(css,/\.sjn-exam-/);
});

test('Review duration and multiple saved subjects use real attempt metadata',()=>{
  assert.match(html,/subjects: Array\.isArray\(row\.selection_json\?\.subjects\)/);
  assert.match(js,/function subjectNames\(log\)/);
  assert.match(js,/const displaySubjects = \(log,mobile=false\)/);
  assert.match(js,/displaySubjects\(log,true\)/);
  assert.match(js,/payload\.items\.map\(item=>item\.subject\)/);
  assert.match(js,/Time Taken: /);
  assert.match(js,/function formatTimeTaken\(seconds\)/);
});
