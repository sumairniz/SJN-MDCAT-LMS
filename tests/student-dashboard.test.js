'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'public/index.html'),'utf8');
const code=fs.readFileSync(path.join(base,'public/sjn-dashboard.js'),'utf8');
const css=fs.readFileSync(path.join(base,'public/sjn-dashboard.css'),'utf8');
function fixture(owner='student-1'){
 const handlers=new Map(),elements=new Map(),calls=[];
 const el=(id)=>{
  if(!elements.has(id))elements.set(id,{textContent:'',style:{width:''},hidden:false,dataset:{},
    listeners:{},addEventListener(type,cb){this.listeners[type]=cb},classList:{contains:()=>false}});
  return elements.get(id);
 };
 let user=owner;
 const source={
  totals:{answered:12,correct:9,skipped:5,tests:2},
  nodes:[
   {source_type:'pastbank',subject:'Biology',answered:5,correct:4},
   {source_type:'courses',subject:'Biology',answered:3,correct:2},
   {source_type:'papers',subject:'Physics',answered:4,correct:3},
   {source_type:'pastbank',subject:'Chemistry',answered:0,correct:0}
  ]
 };
 const bridge={userId:()=>user,load:async url=>{
  calls.push({user,url});return {userId:user,summary:source}},openModule:x=>calls.push({module:x}),
  resume:async id=>calls.push({resume:id})};
 const window={SJNDashboardBridge:bridge};
 const document={getElementById:id=>el(id)};
 vm.runInNewContext(code,{window,document,Date,Math,Number,String,Array,JSON,Intl,console,Promise},{filename:'sjn-dashboard.js'});
 return {window,elements:el,calls,bridge,changeOwner:id=>{user=id},source};
}
test('Dashboard assets load; welcome copy and Quick Start replace duplicate launcher',()=>{
 assert.doesNotThrow(()=>new vm.Script(code));
 assert.match(html,/sjn-dashboard\.css/);
 assert.match(html,/sjn-dashboard\.js/);
 assert.match(html,/Every question brings you one step closer to your goal/);
 assert.match(html,/Continue your preparation and make today count/);
 assert.match(html,/id="sjn-db-quote-text"/);
 assert.match(html,/id="sjn-db-resume"/);
 assert.match(html,/id="sjn-db-create-test"/);
 assert.doesNotMatch(html,/Launch Quick 5-MCQ Drill/);
 assert.doesNotMatch(html,/LMS Direct Access/);
 assert.match(css,/sjn-db-quote-panel blockquote\{font-family:Georgia/);
 assert.match(css,/@media\(max-width:600px\)/);
});
test('Authenticated all-time Dashboard excludes skipped items, combines all sources and does not duplicate fetches',async()=>{
 const x=fixture();
 await x.window.SJNDashboard.enter();
 assert.equal(x.calls.length,1);
 assert.equal(x.calls[0].url,'/student-analytics?offset=0');
 assert.equal(x.elements('dash-mcqs').textContent,'12');
 assert.equal(x.elements('dash-accuracy').textContent,'75%');
 assert.equal(x.elements('nav-mcqs-count').textContent,'12');
 assert.equal(x.elements('nav-accuracy').textContent,'75%');
 assert.equal(x.elements('subj-bio-acc').textContent,'75%');
 assert.equal(x.elements('subj-bio-count').textContent,'8 answered · 6 correct');
 assert.equal(x.elements('subj-phys-acc').textContent,'75%');
 assert.equal(x.elements('subj-chem-acc').textContent,'Not started');
 assert.equal(x.elements('subj-eng-acc').textContent,'Not started');
 assert.equal(x.elements('dash-accuracy-bar').style.width,'75%');
 assert.match(x.elements('sjn-db-quote-author').href,/^https:\/\//);
 await x.window.SJNDashboard.enter();
 assert.equal(x.calls.length,1);
 x.window.SJNDashboard.invalidate();
 await x.window.SJNDashboard.enter();
 assert.equal(x.calls.length,2);
 x.changeOwner('student-2');
 await x.window.SJNDashboard.enter();
 assert.equal(x.calls.length,3);
 assert.equal(x.calls[2].user,'student-2');
 x.window.SJNDashboard.reset();
 assert.equal(x.elements('sjn-db-resume').hidden,true);
});
test('Resume card only appears for authenticated matching saved draft and calls existing draft resume',async()=>{
 const x=fixture();await x.window.SJNDashboard.enter();
 x.window.SJNDashboard.updateHistory('other-user',[{status:'in-progress',id:'draft-other'}]);
 assert.equal(x.elements('sjn-db-resume').hidden,true);
 x.window.SJNDashboard.updateHistory('student-1',[{status:'completed',id:12}]);
 assert.equal(x.elements('sjn-db-resume').hidden,true);
 x.window.SJNDashboard.updateHistory('student-1',[{status:'in-progress',id:'draft-valid',title:'Biology Practice',answered:3,total:20}]);
 assert.equal(x.elements('sjn-db-resume').hidden,false);
 assert.equal(x.elements('sjn-db-resume-title').textContent,'Biology Practice');
 assert.equal(x.elements('sjn-db-resume-info').textContent,'3 of 20 answered');
 await x.elements('sjn-db-resume-button').listeners.click();
 assert.ok(x.calls.some(c=>c.resume==='draft-valid'));
 assert.equal(x.elements('sjn-db-resume').hidden,true);
});
test('Existing finalized features and pending level logic are not replaced',()=>{
 assert.match(html,/id="module-analytics"/);
 assert.match(html,/id="module-history"/);
 assert.match(html,/id="module-wizard"/);
 assert.match(html,/window\.SJNAnalytics\?\.enter/);
 assert.match(html,/Level criteria to be finalized/);
 assert.match(html,/window\.SJNDashboard\?\.reset\(\)/);
 assert.match(html,/window\.SJNDashboard\?\.updateHistory/);
 assert.match(html,/window\.SJNDashboard\?\.invalidate\(\)/);
 assert.match(code,/window\.SJNDashboard=\{enter,reset,invalidate,sync,updateHistory\}/);
 assert.doesNotMatch(code,/localStorage|sessionStorage/);
 assert.doesNotMatch(code,/\.post\(|\.put\(|method:'POST'|method:'PUT'/);
});
