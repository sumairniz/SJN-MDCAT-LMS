'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {buildQuestionStatus}=require('../lib/practice-question-status');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
const begin=html.indexOf('    window.SJNPracticeFilters = (() => {');
const end=html.indexOf('    })();',begin);
assert.ok(begin>0&&end>begin);

function makeHarness(request){
  const controls=['unused','incorrect','skipped','marked','correct'].map(v=>({
    dataset:{sjnFilter:v},attrs:{},setAttribute(n,value){this.attrs[n]=value;},
    addEventListener(name,callback){this.click=callback;}
  }));
  const panel={classList:{toggle(){}},querySelectorAll(){return controls;}};
  const note={textContent:''};
  const retry={classList:{toggle(){}},addEventListener(name,callback){this.click=callback;}};
  const nodes={'sjn-question-filters':panel,'sjn-filter-status':note,'sjn-filter-retry':retry};
  const ctx={
    window:{},currentUser:{id:'student-a'},wizardQuestionFiltersActive:true,
    wizardSelection:{currentStepNum:4},
    document:{getElementById:id=>nodes[id],querySelectorAll:()=>controls},
    api:request,updateWizardAvailableCount(){},updateSummaryBox(){},
    console:{warn(){}},Set,Map,Number,Array,String
  };
  vm.createContext(ctx);
  vm.runInContext(html.slice(begin,end+'    })();'.length),ctx);
  return {ctx,filters:ctx.window.SJNPracticeFilters,controls,note,retry};
}

test('Filter server data rejects invalid/unsorted completed answer rows and accepts empty history',()=>{
  const rows=[
    {attempt_id:9,mcq_id:1,selected_index:null,is_correct:false},
    {attempt_id:9,mcq_id:2,selected_index:0,is_correct:false},
    {attempt_id:7,mcq_id:1,selected_index:2,is_correct:true},
    {attempt_id:7,mcq_id:3,selected_index:3,is_correct:true}
  ];
  const status=buildQuestionStatus(rows,[{mcq_id:2}]);
  assert.deepEqual(status.latest,[[1,'skipped'],[2,'incorrect'],[3,'correct']]);
  assert.deepEqual(status.marked,[2]);
  assert.deepEqual(buildQuestionStatus([],[]),{latest:[],marked:[]});
  assert.throws(()=>buildQuestionStatus(rows.toReversed(),[]),/ordering/);
  assert.throws(()=>buildQuestionStatus([{...rows[0],is_correct:true}],[]),/grade/);
  assert.throws(()=>buildQuestionStatus([{...rows[1],selected_index:7}],[]),/answer/);
});

test('Unused by default; OR combinations include each identity once, latest outcome wins',async()=>{
  let calls=0;
  const h=makeHarness(async()=>{calls++;return {
    userId:'student-a',
    latest:[[1,'skipped'],[2,'incorrect'],[3,'correct']],
    marked:[2,3]
  };});
  await h.filters.load();
  assert.equal(h.filters.status(),'ready');
  assert.equal(calls,1);
  assert.equal(h.filters.matches(4),true,'unseen question is unused');
  assert.equal(h.filters.matches(1),false,'skipped submitted question is not unused');
  h.controls[1].click(); // incorrect
  h.controls[3].click(); // marked
  assert.equal(h.filters.matches(2),true,'incorrect and marked included once by identity');
  assert.equal(h.filters.matches(3),true,'correct but marked also included');
  assert.equal(h.filters.matches(1),false);
  h.controls[2].click(); // skipped
  assert.equal(h.filters.matches(1),true);
  h.controls[4].click(); // correct
  assert.equal(h.filters.matches(3),true);
  h.controls[0].click(); // remove Unused
  h.controls[1].click(); // remove Incorrect
  h.controls[2].click(); // remove Skipped
  h.controls[3].click(); // remove Marked
  h.controls[4].click(); // prevent removing only remaining filter
  assert.equal(h.controls[4].attrs['aria-pressed'],'true');
  assert.equal(h.filters.matches(4),false);
  await h.filters.load();
  assert.equal(calls,1,'ready history reused within same account');
});

test('Failed request blocks matches until explicit retry verifies same account',async()=>{
  let calls=0;
  const h=makeHarness(async()=>{if(++calls===1)throw Error('offline');return {
    userId:'student-a',latest:[],marked:[]
  };});
  await h.filters.load();
  assert.equal(h.filters.status(),'error');
  assert.equal(h.filters.matches(5),false);
  await h.filters.load();
  assert.equal(h.filters.status(),'ready');
  assert.equal(h.filters.matches(5),true);
  assert.equal(calls,2);
});

test('Account switches and outdated asynchronous responses never leak prior student status',async()=>{
  let resolve;
  const h=makeHarness(()=>new Promise(r=>{resolve=r;}));
  const pending=h.filters.load();
  h.filters.resetSession();
  h.ctx.currentUser={id:'student-b'};
  resolve({userId:'student-a',latest:[[1,'correct']],marked:[1]});
  await pending;
  assert.equal(h.filters.status(),'idle');
  assert.equal(h.filters.matches(1),false);
  assert.equal(h.controls[0].attrs['aria-pressed'],'true');
});

test('UI stays compact; direct test entry flows bypass filters; no drafts, autosave, counts or production change',()=>{
  assert.match(html,/id="sjn-question-filters"/);
  assert.match(html,/data-sjn-filter="unused" aria-pressed="true"/);
  for(const name of ['unused','incorrect','skipped','marked','correct'])
    assert.match(html,new RegExp('data-sjn-filter="'+name+'"'));
  assert.doesNotMatch(html,/data-sjn-filter="used"/);
  assert.match(html,/#module-wizard \.sjn-filter-chip/);
  assert.match(html,/window\.SJNPracticeFilters\?\.matches\(q\.id\) === true/);
  assert.match(html,/wizardQuestionFiltersActive = false;\s+wizardSelection =/);
  assert.match(html,/window\.practiceCourse = function\(id\) \{\s+wizardQuestionFiltersActive = false;/);
  assert.match(html,/window\.practicePastPaper = function\(id, source\) \{\s+wizardQuestionFiltersActive = false;/);
  assert.match(html,/window\.SJNHistoryLaunchRetake = async function\(payload\) \{\s+wizardQuestionFiltersActive = false;/);
  assert.match(html,/async resume\(id\) \{\s+wizardQuestionFiltersActive = false;/);
  assert.match(html,/window\.SJNPracticeFilters\?\.invalidate\(\)/);
  assert.match(server,/app\.get\('\/api\/practice\/question-status', auth/);
  assert.match(server,/readStudentStatusPages\(req\.db, 'attempt_items'/);
  assert.match(server,/readStudentStatusPages\(req\.db, 'bookmarks'/);
  assert.doesNotMatch(server.slice(server.indexOf("app.get('/api/practice/question-status'"),server.indexOf("app.get('/api/history/:attemptId'")),/practice_drafts|service_role|\.insert\(|\.update\(|\.delete\(/);
});
