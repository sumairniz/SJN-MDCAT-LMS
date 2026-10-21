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
  assert.match(js,/state\.statusFilter !== 'all' && log\.status !== state\.statusFilter/);
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

test('Desktop-only in-progress details use SJN yellow and retain original table/mobile layout',()=>{
  assert.match(js,/score\.append\(el\('small','sjn-history-progress-count',log\.answered\+' \/ '\+log\.total\+' answered'\)\)/);
  assert.match(js,/Math\.round\(100\*Number\(log\.answered\)\/Number\(log\.total\)\)/);
  assert.match(js,/isDraft\?completePercent\+'% Complete':log\.accuracy/);
  assert.match(css,/sjn-history-table \.sjn-history-score-cell\.is-in-progress\{color:#facc15!important\}/);
  assert.match(css,/sjn-history-table \.sjn-history-progress-count/);
  assert.match(js,/scoreBlock\.append\(el\('strong','',log\.status==='in-progress'\?'In Progress':log\.score\),el\('small','',log\.status==='in-progress'\?\(log\.answered\+' \/ '\+log\.total\+' answered'\):log\.accuracy\)\)/);
  assert.match(css,/sjn-history-table th:nth-child\(6\)\{width:34%\}/);
  assert.doesNotMatch(js,/sjn-history-progress-bar/);
});

test('Mobile in-progress heading uses identical desktop yellow without altering completed cards',()=>{
  assert.match(js,/const card=el\('article','sjn-history-card'\+\(isDraft\?' is-in-progress':''\)\)/);
  assert.match(css,/sjn-history-card\.is-in-progress \.sjn-history-card-score strong\{color:#facc15\}/);
  assert.match(css,/sjn-history-card-score strong\{display:block;font-size:21px;color:#4ade80\}/);
  assert.match(js,/scoreBlock\.append\(el\('strong','',log\.status==='in-progress'\?'In Progress':log\.score\)/);
});

test('History refresh after exam reload retrieves completed attempts and drafts without stale overwrite',()=>{
  assert.match(html,/if \(modName === 'history' && typeof window\.reloadStudentHistory === 'function'\)/);
  assert.match(html,/void window\.reloadStudentHistory\(\{ fresh: true \}\)/);
  assert.match(html,/window\.reloadStudentHistory = loadStudentHistory/);
  assert.doesNotMatch(html,/if \(modName === 'history'\) void loadStudentHistory/);
  assert.match(html,/let activeHistoryRequest = null/);
  assert.match(html,/let latestHistoryRequest = 0/);
  assert.match(html,/if \(!fresh && activeHistoryRequest\?\.studentId === expectedStudentId\)/);
  assert.match(html,/const requestNumber = \+\+latestHistoryRequest/);
  assert.match(html,/requestNumber !== latestHistoryRequest/);
  assert.match(html,/api\('\/history', \{ cache: 'no-store' \}\)/);
  assert.match(html,/api\('\/practice\/drafts', \{ cache: 'no-store' \}\)/);
  assert.match(html,/drafts\.userId!==expectedStudentId/);
  assert.match(html,/\.\.\.drafts\.drafts\.map\(row=>\(\{/);
  assert.doesNotMatch(html,/modName === 'quiz'\) void loadStudentHistory/);
});

// Navigation is declared in the legacy page script, while the authenticated
// loader is enclosed in a later IIFE. Exercise that scope boundary directly.
test('Save & Exit history navigation uses a callable cross-script bridge',()=>{
  const navigation=html.match(/function switchModule\(modName\) \{[\s\S]*?\n    \}\n\n    function setWizardStep/);
  assert.ok(navigation,'legacy navigation function exists');
  const body=navigation[0].replace(/\n\n    function setWizardStep[\s\S]*/,'');
  const shown=[];
  const context={
    document:{querySelectorAll:()=>[],getElementById:()=>({classList:{add(){},remove(){}}})},
    window:{scrollTo(){},innerWidth:1024,reloadStudentHistory:(options)=>{shown.push(options);return Promise.resolve(true);}}
  };
  vm.runInNewContext(body+';switchModule("history");',context);
  assert.equal(shown.length,1,'one history refresh triggered by exit/navigation');
  assert.equal(shown[0].fresh,true);
  vm.runInNewContext('switchModule("wizard");',context);
  assert.equal(shown.length,1,'unrelated workspace navigation does not reload drafts');
  delete context.window.reloadStudentHistory;
  assert.doesNotThrow(()=>vm.runInNewContext('switchModule("history");',context),'history link does not throw when account bridge is not ready');
});
