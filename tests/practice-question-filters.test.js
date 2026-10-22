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
const end=html.indexOf('\n    })();',begin);
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
  vm.runInContext(html.slice(begin,end+'\n    })();'.length),ctx);
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


test('New practice modes and confirmed submissions reset only chip choices to Unused',async()=>{
  let calls=0;
  const h=makeHarness(async()=>{calls++;return {userId:'student-a',latest:[[1,'incorrect']],marked:[1]};});
  await h.filters.load();
  h.controls[1].click();
  assert.equal(h.controls[1].attrs['aria-pressed'],'true');
  assert.equal(h.filters.matches(1),true);
  h.filters.resetSelection();
  assert.equal(h.controls[0].attrs['aria-pressed'],'true');
  for (const chip of h.controls.slice(1)) assert.equal(chip.attrs['aria-pressed'],'false');
  assert.equal(h.filters.status(),'ready','reset selection keeps previously verified history');
  assert.equal(h.filters.matches(1),false,'Incorrect must not carry over');
  assert.equal(calls,1,'reset never makes a redundant verification request');
  assert.match(html,/function selectPracticeScope\(scope\) \{\s+wizardSelection\.scope = scope;\s+\/\/ New practice mode[\s\S]*?window\.SJNPracticeFilters\?\.resetSelection\(\)/);
  assert.match(html,/savedAttemptOutcome = outcome;\s+\/\/ The next test[\s\S]*?window\.SJNPracticeFilters\?\.resetSelection\(\);\s+window\.SJNPracticeFilters\?\.invalidate\(\)/);
  assert.match(html,/function selectWizardOption\(type, val\) \{[\s\S]*?window\.SJNPracticeFilters\?\.resetSelection\(\)/);
  assert.doesNotMatch(html.slice(html.indexOf('function prevWizardStep()'),html.indexOf('function selectWizardOption(')),/resetSelection\(/);
});

test('Practice cards follow the agreed order with original colors, descriptions and dimensions',()=>{
  const step2=html.slice(html.indexOf('<!-- Step 2: Practice Scope Selection -->'),html.indexOf('<!-- Step 3: Subject Selection -->'));
  const cards=[...step2.matchAll(/<button onclick="selectPracticeScope\('([^']+)'\)" class="([^"]+)">([\s\S]*?)<\/button>/g)];
  assert.deepEqual(cards.map(c=>c[1]),['custom-mix','topic-wise','subject-wise','all-subjects']);
  assert.ok(cards.every(c=>c[2].includes('p-4 rounded-xl border border-sjn-border bg-zinc-900')));
  assert.match(cards[0][2],/hover:border-emerald-500/);
  assert.match(cards[1][2],/hover:border-amber-500/);
  assert.match(cards[2][2],/hover:border-blue-500/);
  assert.match(cards[3][2],/hover:border-red-500/);
  assert.match(cards[0][3],/Custom Quiz/);
  assert.match(cards[1][3],/Topic Drill/);
  assert.match(cards[2][3],/One or Multiple Subjects/);
  assert.match(cards[3][3],/All Subjects/);
  assert.match(step2,/grid grid-cols-1 sm:grid-cols-2 gap-3/);
});

test('Only selected chips use restrained semantic accent colors, preserving neutral unselected style',()=>{
  for(const [filter,color,icon] of [
    ['unused','#60a5fa','fa-circle-dot'],
    ['incorrect','#f87171','fa-circle-xmark'],
    ['skipped','#eab308','fa-circle-minus'],
    ['marked','#a78bfa','fa-bookmark'],
    ['correct','#34d399','fa-circle-check']
  ]){
    assert.match(html,new RegExp('sjn-filter-chip\\[data-sjn-filter="'+filter+'"\\]\\{\\s*--sjn-chip-accent:'+color));
    assert.match(html,new RegExp('data-sjn-filter="'+filter+'"[^>]+><i class="fa-solid '+icon+' sjn-filter-icon" aria-hidden="true"></i>'));
  }
  assert.match(html,/#module-wizard \.sjn-filter-chip\[aria-pressed="true"\]\{[\s\S]*?color:var\(--sjn-chip-text\)/);
  assert.match(html,/#module-wizard \.sjn-filter-icon\{display:none/);
  assert.match(html,/#module-wizard \.sjn-filter-chip\[aria-pressed="true"\] \.sjn-filter-icon\{display:inline-block\}/);
  assert.match(html,/border:1px solid #45454d;border-radius:9px;padding:8px 11px/);
});
