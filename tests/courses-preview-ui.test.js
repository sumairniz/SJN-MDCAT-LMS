'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'public/sjn-courses.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public/sjn-courses.css'),'utf8');
test('Courses staging preview loads its own scoped assets without changing the exam',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.match(html,/id="module-courses"[^>]*aria-label="My Courses and test sessions"/);
 assert.match(html,/id="sjn-courses-root"/);
 assert.match(html,/sjn-courses.css\?v=20261101-courses-refinement-2/);
 assert.match(html,/sjn-courses.js\?v=20261101-courses-refinement-2/);
 assert.match(html,/if \(!hasPublished\) \{ window.SJNCoursesPreview\?\.render\(\); return; \}/);
 assert.doesNotMatch(css,/(?:^|\n)\s*body\s*\{/);
 assert.match(css,/#module-courses .sjn-c-session-card/);
});
test('Three uniquely named sample sessions and directly visible tests',()=>{
 for(const name of ['Genome Test Session 2026','Early Mock Session','Final Sprint Mock Series'])assert.ok(js.includes(name));
 assert.match(js,/My Enrolled Sessions/);assert.match(js,/Explore Other Sessions/);
 assert.match(js,/Access your enrolled test sessions and explore more sessions/);
 assert.match(js,/data-c-test/);
 assert.match(js,/Scheduled: /);
 assert.doesNotMatch(js,/data-c-date|calendarPicker|selectedDate/);
});
test('Sample courses remain non-functional for scoring, attempts, and enrollment',()=>{
 assert.match(js,/Sample Test · Exam Not Available/);
 assert.match(js,/disabled aria-label="Sample test/);
 assert.doesNotMatch(js,/(fetch\(|XMLHttpRequest|localStorage|sessionStorage|SJNStartPublishedPaper|launchGeneratedQuiz|finishQuiz\(|window\.practiceCourse\()/);
 assert.match(js,/No real enrollment or test has been created/);
});
test('Syllabus subject groups and keyboard-accessible button navigation are present',()=>{
 assert.match(js,/details class="sjn-c-syllabus-group"/);
 assert.match(js,/data-c-session/);assert.match(js,/data-c-back/);
 assert.match(js,/data-c-filter/);assert.match(js,/aria-pressed/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/focus-visible/);
 assert.match(css,/@media\(max-width:550px\)/);
});

test('Approved Courses refinement: details popup, access gating, mobile tabs and subjects only',()=>{
 assert.match(js,/SJN MedNest Academy/);
 assert.match(js,/data-c-details/);
 assert.match(js,/data-c-modal-tab/);
 assert.match(js,/data-c-modal-close/);
 assert.match(js,/data-c-modal-backdrop/);
 assert.match(js,/aria-modal="true"/);
 assert.match(js,/Not enrolled · Locked/);
 assert.match(js,/if\(!x\?\.enrolled\)return/);
 assert.match(js,/data-c-test-tab/);
 assert.match(css,/#module-courses \.sjn-c-test-tabs/);
 assert.match(css,/@media\(max-width:850px\)/);
 assert.match(css,/backdrop-filter:blur\(6px\)/);
 assert.doesNotMatch(js,/Carbohydrates, lipids and proteins|Molecular shapes and hybridization/);
});
