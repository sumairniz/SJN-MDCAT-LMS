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
 assert.match(html,/sjn-courses.css\?v=20261102-full-schedule/);
 assert.match(html,/sjn-courses.js\?v=20261101-last-attempt-1/);
 assert.match(html,/window\.SJNCoursesPreview\?\.refresh\?\.\(\)/);
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
test('Genome published tests use guarded live launch while other sessions stay illustrative',()=>{
 assert.match(js,/SJNCourseBridge\?\.start/);
 assert.match(js,/data-c-start/);
 assert.match(js,/!t\.id/);
 assert.doesNotMatch(js,/(XMLHttpRequest|localStorage|sessionStorage|SJNStartPublishedPaper|launchGeneratedQuiz|finishQuiz\()/);
 assert.match(js,/Production unchanged/);
});
test('Syllabus subject groups and keyboard-accessible button navigation are present',()=>{
 assert.match(js,/details class="sjn-c-syllabus-group /);
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

test('Third owner-approved Courses UX has independent access/completion and filters',()=>{
 assert.match(js,/data-c-card-overlay|sjn-c-card-overlay/);
 assert.match(js,/data-c-details/);
 assert.match(js,/sjn-c-card-action/);
 assert.match(js,/role="progressbar"/);
 assert.match(js,/['"]Unattempted['"]/);
 assert.match(js,/availability==='Available'/);
 assert.match(js,/completion==='Completed'/);
 assert.match(js,/data-c-mode/);
 assert.match(js,/Exam-style test/);
 assert.match(js,/fullSyllabus/);
 assert.match(js,/Full Syllabus/);
 assert.match(js,/Not Attempted/);
 assert.match(js,/Unavailable/);
 assert.match(css,/sjn-c-syllabus-list li::before/);
 assert.match(css,/sjn-c-subj-lr/);
 assert.match(css,/sjn-c-filter-count/);
 assert.match(css,/sjn-c-card-overlay/);
 assert.doesNotMatch(js,/Sample enrolled|Sample Tests|Demo progress|DESIGN PREVIEW/);
});

test('The course bridge and backend use the same secure submission flow',()=>{
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 const phase=fs.readFileSync(path.join(root,'public/sjn-phase4-preview.js'),'utf8');
 assert.match(html,/window\.SJNCourseBridge = /);
 assert.match(html,/historyRetakeTitle='Genome Test Session/);
 assert.match(html,/courseTestId:courseTest\.id/);
 assert.match(html,/wizardSelection\.scope === 'course-test'/);
 assert.match(html,/window\.SJNCoursesPreview\?\.refresh/);
 assert.match(server,/app\.get\('\/api\/course-tests', auth/);
 assert.match(server,/\.eq\('user_id',req\.user\.id\)/);
 assert.match(server,/courseTestId/);
 assert.match(phase,/courseTestId:wizardSelection\.courseTestId/);
 assert.match(js,/sjn-c-progress-head/);
 assert.match(css,/\.sjn-c-progress-head>\.sjn-c-bar/);
 assert.match(css,/\.sjn-c-launch:not\(\[disabled\]\)/);
});

test('Latest-attempt student UX shares saved history and preserves other sessions',()=>{
 const history=fs.readFileSync(path.join(root,'public/sjn-history.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 assert.match(js,/Last Completed Result/);
 assert.match(js,/Current Attempt/);
 assert.match(js,/draftAnswered/);
 assert.match(js,/Test Mode — Saved Attempt/);
 assert.match(js,/data-c-result/);
 assert.match(js,/View Result/);
 assert.match(js,/Resume Test/);
 assert.match(js,/Retake Test/);
 assert.match(js,/Available Anytime/);
 assert.match(js,/sjn-c-hero-details-mobile/);
 assert.match(css,/\.sjn-c-test-tab\.is-selected/);
 assert.match(css,/\.sjn-c-session-card\.is-explore \.sjn-c-details-btn/);
 assert.match(css,/\.sjn-c-detail-layout\{align-items:start\}/);
 assert.match(server,/latestAttempt:latest/);
 assert.match(server,/draftId:d\?\.id\|\|null/);
 assert.match(server,/courseProgressEligible===false/);
 assert.match(server,/Date\.parse\(candidate\.updated_at\)>Date\.parse\(a\.created_at\)/);
 assert.match(html,/viewResult: async/);
 assert.match(html,/retake: async/);
 assert.match(history,/openSavedResult\(id\)/);
});


test('A newer course draft coexists with the last result, while History retakes stay independent',()=>{
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 const phase=fs.readFileSync(path.join(root,'public/sjn-phase4-preview.js'),'utf8');
 assert.match(server,/completion:d\?'In Progress'/);
 assert.match(server,/latestAttempt:latest,hasCompleted:!!latest/);
 assert.match(server,/draftMode:d\?\.mode\|\|null,draftAnswered:answered/);
 assert.match(js,/const action=t\.draftId\?window\.SJNCourseBridge/);
 assert.match(js,/if\(activeTest\?\.draftId\)return/);
 assert.match(js,/modeHTML\('timed',!!t\.draftId\)/);
 assert.match(html,/courseProgressEligible:courseModeOverride!==null/);
 assert.match(html,/courseProgressEligible:wizardSelection\.courseProgressEligible!==false/);
 assert.match(phase,/courseProgressEligible:wizardSelection\.courseProgressEligible!==false/);
 assert.doesNotMatch(html,/switchModule\('history'\);\s*return window\.SJNHistory\.openSavedResult/);
 assert.match(html,/return window\.SJNHistory\.openSavedResult\(id\)/);
});

test('Full Genome schedule is read-only planning data independent of attempted tests',()=>{
 const scheduleSource=fs.readFileSync(path.join(root,'public/sjn-genome-schedule.js'),'utf8');
 assert.doesNotThrow(()=>new vm.Script(scheduleSource));
 const ctx={window:{},Object,Number,Error};
 vm.runInNewContext(scheduleSource,ctx);
 const plan=Array.from(ctx.window.SJNGenomeSchedule);
 assert.equal(plan.length,97);
 assert.deepEqual(plan.map(t=>t.no),Array.from({length:97},(_,i)=>i+4));
 assert.equal(plan[0].units,'Cell Structure & Function');
 assert.equal(plan[0].date,'2026-11-02');
 assert.equal(plan[plan.length-1].date,'2027-03-13');
 assert.equal(plan[plan.length-1].count,180);
 assert.equal(plan[plan.length-1].minutes,180);
 assert.match(html,/sjn-genome-schedule\.js\?v=20261102-full-schedule/);
 assert.ok(html.indexOf('sjn-genome-schedule.js')<html.indexOf('sjn-courses.js?v=20261102-full-schedule'));
 assert.match(js,/genomePlan\.find\(t=>!liveNos\.has\(t\.no\)\)/);
 assert.match(js,/id:null,no:next\.no/);
 assert.match(js,/availability:'Upcoming',completion:'Not Attempted'/);
 assert.match(js,/s\.id==='genome'&&t\.availability==='Upcoming'\?'Not Yet Available'/);
 assert.match(js,/const scheduleRows=/);
 assert.match(js,/Complete Test Schedule/);
 assert.match(js,/totalTests\(s\)/);
 assert.doesNotMatch(scheduleSource,/courseTestId|submissionKey|window\.launchGeneratedQuiz/);
});
