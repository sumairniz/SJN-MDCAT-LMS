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
  assert.match(html,/void window\.reloadStudentHistory\(\)/);
  assert.match(html,/window\.reloadStudentHistory = loadStudentHistory/);
  assert.doesNotMatch(html,/if \(modName === 'history'\) void loadStudentHistory/);
  assert.match(html,/let activeHistoryRequest = null/);
  assert.match(html,/let latestHistoryRequest = 0/);
  assert.match(html,/if \(!fresh && activeHistoryRequest\?\.studentId === expectedStudentId &&/);
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
  assert.equal(shown[0],undefined,'no forced reload on ordinary navigation');
  vm.runInNewContext('switchModule("wizard");',context);
  assert.equal(shown.length,1,'unrelated workspace navigation does not reload drafts');
  delete context.window.reloadStudentHistory;
  assert.doesNotThrow(()=>vm.runInNewContext('switchModule("history");',context),'history link does not throw when account bridge is not ready');
});

test('Topic Drill manual drafts validate published MCQ revisions without exposing historical answer keys',()=>{
  const draftEndpoint=server.slice(server.indexOf("app.put('/api/practice/drafts'"),server.indexOf("// Stage 3B-2: PostgreSQL scores"));
  assert.match(draftEndpoint,/\.from\('mcqs'\)/);
  assert.match(draftEndpoint,/\.select\('id,current_revision_id'\)/);
  assert.match(draftEndpoint,/\.in\('id',draft.items.map\(x=>x.mcqId\)\)/);
  assert.match(draftEndpoint,/revisions.get\(x.mcqId\)!==x.revisionId/);
  assert.match(draftEndpoint,/Question revisions could not be verified/);
  assert.doesNotMatch(draftEndpoint,/\.from\('mcq_revisions'\)/);
  assert.doesNotMatch(draftEndpoint,/correct_index|options_json|service_role/);
  assert.match(draftEndpoint,/req.get\('X-SJN-Expected-Student'\)!==req.user.id/);
  assert.match(draftEndpoint,/validateDraft\(req.body\)/);
  assert.match(draftEndpoint,/\.eq\('user_id',req.user.id\)/);
});

test('Approved refresh recovery never autosaves answers and requires verified same student',()=>{
  const preview=fs.readFileSync(path.join(root,'public/sjn-phase4-preview.js'),'utf8');
  assert.match(html,/const EXAM_RECOVERY_KEY = 'sjn_exam_refresh_v1'/);
  assert.match(html,/sessionStorage.setItem\(EXAM_RECOVERY_KEY, JSON.stringify\(value\)\)/);
  assert.match(html,/record.owner !== currentUser.id/);
  assert.match(html,/record.kind === 'draft'/);
  assert.match(html,/await window.SJNDrafts.resume\(record.id\)/);
  assert.match(html,/record.items.map\(item =>/);
  assert.match(html,/currentById.get\(item.mcqId\)\?\.revisionId === item.revisionId/);
  assert.match(html,/new Set\(questions.map\(q => q.id\)\).size !== questions.length/);
  assert.match(html,/window.launchGeneratedQuiz\(questions\)/);
  assert.match(html,/if \(window.location.pathname === '\/quiz\/session'\) await window.SJNExamRecovery\?\.restore\(\)/);
  assert.match(html,/window.SJNExamRecovery\?\.forget\(\)/);
  assert.doesNotMatch(html,/sessionStorage.setItem\([^;]*(?:userAnswers|answers_json|checked_json)/);
  assert.match(preview,/window.SJNExamRecovery\?\.rememberNew\(\)/);
  assert.match(preview,/window.SJNExamRecovery\?\.rememberDraft\(draft.id\)/);
  assert.match(preview,/window.SJNExamRecovery\?\.forget\(\)/);
  assert.doesNotMatch(preview,/Your previous preview test cannot be restored yet/);
  assert.match(preview,/window.addEventListener\('beforeunload'/);
});

test('Refresh recovery executes blank new-test restart, saved-draft resume and wrong-account guard',async()=>{
  const start=html.indexOf('    const EXAM_RECOVERY_KEY = ');
  const end=html.indexOf('    // Stage A manual drafts:',start);
  assert.ok(start>0&&end>start,'extract actual recovery bridge');
  const recovery=html.slice(start,end);
  const stored=new Map(), launched=[], resumed=[], visited=[];
  let open=false;
  const bank=[
    {id:21,revisionId:210,bank:'Past Papers Question Bank'},
    {id:42,revisionId:420,bank:'Past Papers Question Bank'}
  ];
  const context={
    console:{warn(){}},
    sessionStorage:{
      setItem:(k,v)=>stored.set(k,v),
      getItem:k=>stored.get(k)??null,
      removeItem:k=>stored.delete(k)
    },
    currentUser:{id:'student-a'},
    currentSubmissionKey:'abc',
    currentQuizList:bank,
    currentMcqIndex:1,userAnswers:[3,2],
    wizardSelection:{
      testMode:'timed',subject:'Biology',bank:'Past Papers Question Bank',
      scope:'topic-wise',selectedSubjects:['Biology'],selectedChapters:[],
      selectedTopics:['Biology|||Biological Molecules|||Proteins']
    },
    historyRetakeTitle:null,
    remoteContentLoaded:true,mcqQuestionBank:bank,
    document:{querySelector(){return null},getElementById(){return {prepend(){}}},createElement(){return {}}},
    switchModule:name=>visited.push(name),
    window:{
      location:{pathname:'/quiz/session'},
      history:{replaceState(){}},
      SJNPhase4Exam:{isOpen:()=>open},
      SJNDrafts:{resume:async id=>{resumed.push(id);open=true}},
      launchGeneratedQuiz:questions=>{launched.push(questions.map(q=>q.id));open=true}
    }
  };
  vm.runInNewContext(recovery,context);
  context.window.SJNExamRecovery.rememberNew();
  const data=JSON.parse(stored.get('sjn_exam_refresh_v1'));
  assert.equal(data.kind,'new');
  assert.deepEqual(data.items,[{mcqId:21,revisionId:210},{mcqId:42,revisionId:420}]);
  assert.equal(JSON.stringify(data).includes('answers'),false,'no attempted answer snapshots');
  // Simulate browser navigation/reload, whose live option/position are discarded.
  open=false;context.currentQuizList=[];context.userAnswers=[];
  assert.equal(await context.window.SJNExamRecovery.restore(),true);
  assert.equal(JSON.stringify(launched),'[[21,42]]','original order preserved across VM realms');
  assert.equal(context.wizardSelection.testMode,'timed');
  open=false;
  context.window.SJNExamRecovery.rememberDraft('01234567-89ab-4def-8abc-0123456789ab');
  assert.equal(await context.window.SJNExamRecovery.restore(),true);
  assert.deepEqual(resumed,['01234567-89ab-4def-8abc-0123456789ab']);
  open=false;
  context.currentUser={id:'student-b'};
  assert.equal(await context.window.SJNExamRecovery.restore(),false);
  assert.equal(stored.has('sjn_exam_refresh_v1'),false);
  assert.deepEqual(resumed,['01234567-89ab-4def-8abc-0123456789ab']);
  assert.deepEqual(visited,['wizard'],'wrong-account record returns to Create Test');
});


test('History cache skips unchanged navigation and revalidates after confirmed mutation',()=>{
  const flow=html.slice(html.indexOf('    let activeHistoryRequest = null;'),html.indexOf('    async function loadAccount()'));
  assert.match(flow,/loadedHistoryGeneration === historyGeneration\) return true/);
  assert.match(flow,/loadedHistoryStudentId === expectedStudentId/);
  assert.match(flow,/activeHistoryRequest\.generation === historyGeneration/);
  assert.match(flow,/function markStudentHistoryChanged\(\) \{ historyGeneration\+\+; \}/);
  assert.match(flow,/generation !== historyGeneration/);
  assert.match(flow,/if \(historyLoadStatus !== 'ready' \|\| loadedHistoryStudentId !== expectedStudentId\)/);
  assert.match(html,/if \(result\?\.saved === true\) markStudentHistoryChanged\(\)/);
  assert.match(html,/savedAttemptOutcome = outcome;\s+markStudentHistoryChanged\(\)/);
  assert.match(html,/historyGeneration\+\+;\s+updateDashboardAccountUI\(currentUser\)/);
  assert.doesNotMatch(fs.readFileSync(path.join(root,'public/sjn-phase4-preview.js'),'utf8'),/await window\.SJNDrafts\?\.refreshHistory\(\)/);
});
