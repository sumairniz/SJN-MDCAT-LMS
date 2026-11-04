'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'../public/sjn-analytics.js'),'utf8');
const summary=()=>({
 totals:{tests:2,questions:20,answered:15,correct:12,incorrect:3,skipped:5,elapsed_seconds:700},
 previous:{questions:10,answered:8,correct:5},
 daily:[{day:'2026-11-01',questions:20,answered:15,correct:12}],
 nodes:[{source_type:'pastbank',bank:'Past Papers Question Bank',subject:'Biology',
  chapter:'Biomolecules',topic:'Proteins',group_key:'',questions:20,answered:15,correct:12,
  incorrect:3,skipped:5,unique_questions:17}],
 bankCatalog:[{bank:'Past Papers Question Bank',subject:'Biology',chapter:'Biomolecules',topic:'Proteins',available:200}],
 lifetimeCoverage:[{bank:'Past Papers Question Bank',subject:'Biology',chapter:'Biomolecules',topic:'Proteins',covered:17}],
 periodCoverage:[{bank:'Past Papers Question Bank',subject:'Biology',chapter:'Biomolecules',topic:'Proteins',covered:0,answered_unique:0}],
 courseAttemptBreakdown:[],
 courseCatalog:[{id:1,session:'genome',title:'Acellular Life',subject:'Biology',chapter:'Acellular Life',testNumber:1}],
 paperCatalog:[{id:3,title:'SIBA MDCAT 2025',region:'sindh',year:'2025',size:180}],
 tests:[],legacyAttempts:1
});
test('Analytics renders verified data, navigates hierarchy and clears on student change',async()=>{
 let uid='student-one',calls=0;
 const listeners=new Map();
 const root={innerHTML:'',contains(){return true;},replaceChildren(){this.innerHTML='';},
  querySelector(){return null;},addEventListener(kind,fn){if(!listeners.has(kind))listeners.set(kind,[]);listeners.get(kind).push(fn)}};
 const window={SJNAnalyticsBridge:{userId:()=>uid,load:async()=>{
  calls++;return {userId:uid,summary:summary()};
 }}};
 const context={document:{getElementById:id=>id==='module-analytics'?root:null},
   window,URLSearchParams,console};
 vm.runInNewContext(js,context,{filename:'sjn-analytics.js'});
 await window.SJNAnalytics.enter();
 assert.match(root.innerHTML,/My Analytics/);
 assert.match(root.innerHTML,/80%/);
 assert.match(root.innerHTML,/15/);
 assert.match(root.innerHTML,/Past Papers Question Bank/);
 const click=dataset=>{const event={target:{closest:q=>q==='button'?{
  dataset,hasAttribute:()=>false
 }:null}};for(const listener of (listeners.get('click')||[]))listener(event)};
 click({aTab:'banks'});
 assert.match(root.innerHTML,/Question Bank Analytics/);
 click({aBank:'Past Papers Question Bank'});
 assert.match(root.innerHTML,/Subject Breakdown/);
 assert.match(root.innerHTML,/<b>0<\/b> \/ <b>200<\/b> unique covered/);
 assert.doesNotMatch(root.innerHTML,/<b>17<\/b> \/ <b>200<\/b> unique covered/);
 click({aSubject:'Biology'});
 assert.match(root.innerHTML,/Chapter Breakdown/);
 click({aChapter:'Biomolecules'});
 assert.match(root.innerHTML,/Topic Breakdown/);
 assert.match(root.innerHTML,/Proteins/);
 assert.equal(calls,1);
 await window.SJNAnalytics.enter();
 assert.equal(calls,1,'cached visit must avoid another request');
 uid='student-two';await window.SJNAnalytics.enter();
 assert.equal(calls,2,'account switch must reauthorize and reload');
 window.SJNAnalytics.reset();
 assert.equal(root.innerHTML,'');
});

test('Course test defaults to latest attempt, allows previous attempt and nests chapter inside subject',async()=>{
 const d=summary();
 d.tests=[
  {attempt_id:101,group_key:'1',source_type:'courses',created_at:'2026-11-04T17:00:00Z',questions:5,answered:5,correct:4,incorrect:1,skipped:0},
  {attempt_id:100,group_key:'1',source_type:'courses',created_at:'2026-11-01T16:00:00Z',questions:5,answered:5,correct:2,incorrect:3,skipped:0}
 ];
 d.courseAttemptBreakdown=[
  {attempt_id:101,group_key:'1',subject:'Biology',chapter:'Biomolecules',questions:3,answered:3,correct:3,incorrect:0,skipped:0},
  {attempt_id:101,group_key:'1',subject:'Biology',chapter:'Inheritance',questions:2,answered:2,correct:1,incorrect:1,skipped:0},
  {attempt_id:100,group_key:'1',subject:'Biology',chapter:'Biomolecules',questions:5,answered:5,correct:2,incorrect:3,skipped:0}
 ];
 const callbacks=new Map(),root={innerHTML:'',contains:()=>true,replaceChildren(){this.innerHTML='';},
  querySelector(){return null;},addEventListener(type,cb){
   if(!callbacks.has(type))callbacks.set(type,[]);callbacks.get(type).push(cb);
  }};
 const window={SJNAnalyticsBridge:{userId:()=> 'student-course',load:async()=>({userId:'student-course',summary:d})}};
 vm.runInNewContext(js,{document:{getElementById:id=>id==='module-analytics'?root:null},
  window,URLSearchParams,console},{filename:'sjn-analytics.js'});
 await window.SJNAnalytics.enter();
 function click(dataset){
  const evt={target:{closest:sel=>sel==='button'?{dataset,hasAttribute:()=>false}:null}};
  for(const fn of callbacks.get('click')||[])fn(evt);
 }
 click({aTab:'courses'});click({aCourse:'genome'});
 assert.match(root.innerHTML,/Subject breakdown/);
 assert.match(root.innerHTML,/Biomolecules/);
 assert.match(root.innerHTML,/Inheritance/);
 assert.match(root.innerHTML,/80%/); // Latest 4 of 5
 assert.match(root.innerHTML,/4<\/strong><span>Correct/);
 assert.match(root.innerHTML,/Latest ·/);
 assert.match(root.innerHTML,/data-a-attempt="1"/);
 const target={dataset:{aAttempt:'1'},value:'100',matches:q=>q==='[data-a-attempt]'};
 for(const fn of callbacks.get('change')||[])fn({target});
 assert.match(root.innerHTML,/40%/); // Previous 2 of 5
 assert.match(root.innerHTML,/Biomolecules/);
 assert.doesNotMatch(root.innerHTML,/Inheritance/);
});
