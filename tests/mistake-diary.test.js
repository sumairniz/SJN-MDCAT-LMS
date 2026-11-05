'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const ui=fs.readFileSync(path.join(root,'public/sjn-mistakes.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public/sjn-mistakes.css'),'utf8');
const api=fs.readFileSync(path.join(root,'lib/mistake-diary.js'),'utf8');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const sql=fs.readFileSync(path.join(root,'database/migrations/20261105_mistake_diary_v1.sql'),'utf8');
const {validId,validGroup,categories,statuses}=require('../lib/mistake-diary');
test('Mistake Diary is integrated with authenticated SPA lifecycle without changing exam flow',()=>{
 assert.doesNotThrow(()=>new vm.Script(ui));
 assert.match(html,/id="tab-mistakes"/);
 assert.match(html,/id="module-mistakes"/);
 assert.match(html,/sjn-mistakes\.css\?v=/);
 assert.match(html,/sjn-mistakes\.js\?v=/);
 assert.match(html,/window\.SJNMistakesBridge/);
 assert.match(html,/window\.SJNMistakes\?\.enter\(\)/);
 assert.match(html,/window\.SJNMistakes\?\.reset\(\)/);
 assert.match(html,/window\.SJNMistakes\?\.invalidate\(\)/);
 assert.match(server,/registerMistakeDiaryRoutes\(app,auth\)/);
 assert.match(css,/#module-mistakes/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage|fetch\(/);
});
test('All four MCQ answers, correct and incorrect highlights, source tree and manual categories',()=>{
 assert.match(ui,/e\.options_json\.map\(\(o,n\)=>option\(o,n,e\)\)/);
 assert.match(ui,/idx===e\.correct_index/);
 assert.match(ui,/idx===e\.selected_index/);
 assert.match(ui,/data-answer/);
 assert.match(ui,/Information Gap/);
 assert.match(ui,/Conceptual Mistake/);
 assert.match(ui,/Silly Mistake/);
 assert.match(ui,/Retention Gap/);
 assert.match(ui,/Not Categorized/);
 assert.match(ui,/Need Review/);
 assert.match(ui,/In Progress/);
 assert.match(ui,/Mastered/);
 assert.match(ui,/data-m-edit="note"/);
 assert.match(ui,/data-m-next/);
 assert.match(ui,/source_kind==='banks'/);
 assert.match(ui,/source_kind==='courses'/);
});
test('Mistake API validates student entries, narrow filters and paging',()=>{
 assert.equal(validId('123'),123);
 for(const value of ['0','abc','-1','1.5','999999999999999999999'])assert.equal(validId(value),null);
 assert.deepEqual(validGroup('banks',{subject:'Biology',chapter:'Biomolecules'}),{subject:'Biology',chapter:'Biomolecules'});
 assert.deepEqual(validGroup('courses',{courseTestId:'2'}),{courseTestId:2});
 assert.deepEqual(validGroup('papers',{paperTitle:'UHS MDCAT 2025'}),{paperTitle:'UHS MDCAT 2025'});
 assert.equal(validGroup('banks',{subject:'Biology'}),null);
 assert.equal(validGroup('courses',{courseTestId:'invalid'}),null);
 assert.equal(validGroup('papers',{paperTitle:''}),null);
 assert.equal(categories.size,4);
 assert.equal(statuses.size,3);
 assert.match(api,/\.eq\('user_id',req\.user\.id\)/);
 assert.match(api,/\.range\(\(page-1\)\*limit,page\*limit-1\)/);
 assert.match(api,/selected_index/);
 assert.match(api,/\.upsert\(payload,\{onConflict:'user_id,mcq_id'\}\)/);
 assert.match(api,/req\.body/);
 assert.match(api,/learningNote\.length>1200/);
});
test('DB derives incorrect MCQs, preserves immutable revisions and applies student ownership',()=>{
 assert.match(sql,/security_invoker\s*=\s*true/i);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/user_id\s*=\s*\(SELECT auth\.uid\(\)\)/i);
 assert.match(sql,/FROM public\.attempt_items i/);
 assert.match(sql,/i\.selected_index IS NOT NULL AND i\.is_correct=false/);
 assert.match(sql,/count\(\*\) OVER \(PARTITION BY i\.user_id,i\.mcq_id\)/);
 assert.match(sql,/row_number\(\) OVER/);
 assert.match(sql,/JOIN public\.mcq_revisions r/);
 assert.match(sql,/jsonb_build_object/);
 assert.match(sql,/status_updated_at/);
 assert.doesNotMatch(sql,/UPDATE\s+public\.(attempts|attempt_items|mcq_revisions)/i);
 assert.doesNotMatch(sql,/TRUNCATE|DROP TABLE\s+public\.attempt/i);
});


test('V1.1 keeps the five subjects in approved entrance-exam weightage order',()=>{
 assert.match(ui,/const subjectOrder=\['Biology','Chemistry','Physics','English','Logical Reasoning'\]/);
 assert.match(ui,/subjectRank\(a\[0\]\)-subjectRank\(b\[0\]\)/);
});
test('V1.1 shows separate back navigation and colored category chips on desktop only',()=>{
 assert.match(ui,/class="sjn-m-back-button"/);
 assert.match(ui,/data-m-back="previous"/);
 assert.match(ui,/sjn-m-desktop-categories/);
 assert.match(ui,/sjn-m-mobile-category/);
 for(const category of ['information','conceptual','silly','retention']){
  assert.match(css,new RegExp('data-category='+category+'\\]'));
 }
 assert.match(ui,/categoryTone\(e.category\)/);
 assert.match(css,/@media\(max-width:750px\)/);
 assert.match(css,/\.sjn-m-filters \.sjn-m-mobile-category\{display:flex\}/);
 assert.match(css,/\.sjn-m-desktop-categories\{display:none\}/);
});
test('V1.1 keeps manual note saves and prevents accidental unsaved navigation',()=>{
 assert.match(ui,/function hasUnsavedChanges\(/);
 assert.match(ui,/function mayNavigate\(/);
 assert.match(ui,/window\.confirm\(/);
 assert.match(ui,/if\(action\.mSave\)\{void save\(action\.mSave\);return;\}/);
 assert.match(ui,/window\.addEventListener\('beforeunload'/);
 assert.match(html,/window\.SJNMistakes\?\.canLeave\?\.\(\) === false/);
 assert.match(ui,/sjn-m-note-caption/);
 assert.match(ui,/data-m-next/);
});
test('V1.1 catalog normalizes grouping by question bank chapter, course test and full paper',()=>{
 const migration=fs.readFileSync(path.join(root,'database/migrations/20261106_mistake_diary_catalog_source_grouping.sql'),'utf8');
 assert.match(migration,/CASE WHEN source_kind='banks' THEN subject ELSE '' END/);
 assert.match(migration,/CASE WHEN source_kind='banks' THEN chapter ELSE '' END/);
 assert.match(migration,/CASE WHEN source_kind='courses' THEN course_test_id ELSE NULL END/);
 assert.match(migration,/CASE WHEN source_kind='papers' THEN paper_title ELSE '' END/);
 assert.match(migration,/SECURITY INVOKER/);
 assert.doesNotMatch(migration,/INSERT INTO|UPDATE public\.attempts|DELETE FROM/i);
});

test('V1.2 aligns desktop category chips before right-pinned review status and preserves mobile',()=>{
 const cssText=fs.readFileSync(path.join(root,'public/sjn-mistakes.css'),'utf8');
 const desktop=cssText.split('/* V1.2 — desktop-only')[1];
 assert.ok(desktop);
 assert.match(desktop,/@media\(min-width:751px\)/);
 assert.match(desktop,/\.sjn-m-desktop-categories\{[\s\S]*?order:0;/);
 assert.match(desktop,/\.sjn-m-filters\{[\s\S]*?order:1;/);
 assert.match(desktop,/margin-left:auto/);
 assert.match(desktop,/flex-wrap:nowrap/);
 assert.match(cssText,/@media\(max-width:750px\)/);
 assert.match(cssText,/\.sjn-m-filters \.sjn-m-mobile-category\{display:flex\}/);
});
