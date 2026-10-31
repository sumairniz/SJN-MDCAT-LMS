/* SJN MedNest Academy Courses UX · sample-only staging experience.
   No real enrollment, test attempt, score, timer, submission, or database action.
   The one visible yellow notice identifies the preview; sample exams never start. */
(()=>{'use strict';
const root=document.getElementById('sjn-courses-root');if(!root)return;
const sessions=[
 {id:'genome',name:'Genome Test Session 2026',description:'Chapter-wise preparation, integrated revision and academy-scheduled tests.',type:'Chapter-wise & Mixed Tests',duration:'Nov 2026',enrolled:true,tests:[
 ]},
 {id:'early',name:'Early Mock Session',description:'Start exam-style preparation early with curated full-length and sectional mocks.',type:'Mock Test Series',duration:'Nov–Dec 2026',enrolled:true,tests:[
  {no:1,name:'Early Mock 01 — Foundation',date:'16 Nov 2026',subject:'Mixed Subjects',count:100,minutes:110,availability:'Available',completion:'In Progress',syllabus:{Biology:['Cell Structure and Function','Enzymes'],Chemistry:['Atomic Structure','Stoichiometry'],Physics:['Force and Motion','Vectors'],English:['Vocab']}},
  {no:2,name:'Early Mock 02 — Full Syllabus',date:'22 Nov 2026',subject:'All Subjects',count:150,minutes:150,availability:'Unavailable',completion:'Not Attempted',fullSyllabus:true,syllabus:{}}
 ]},
 {id:'final',name:'Final Sprint Mock Series',description:'A focused final-revision mock series designed for exam-readiness.',type:'Full-Length Mock Session',duration:'Dec 2026',enrolled:false,tests:[
  {no:1,name:'Full-Length Mock 01',date:'02 Dec 2026',subject:'All Subjects',count:180,minutes:180,availability:'Upcoming',completion:'Not Attempted',fullSyllabus:true,syllabus:{}},
  {no:2,name:'Full-Length Mock 02',date:'06 Dec 2026',subject:'All Subjects',count:180,minutes:180,availability:'Upcoming',completion:'Not Attempted',fullSyllabus:true,syllabus:{}}
 ]}
];
const state={session:null,test:null,filter:'All',modal:null,modalTab:'details',testTab:'overview',mode:'timed',focus:null,genomeLoaded:false,genomeError:null,loading:false,launching:false};
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const ico=n=>'<i class="fa-solid fa-'+n+'" aria-hidden="true"></i>';
const subjectClass=x=>({'Biology':'sjn-c-subj-bio','Chemistry':'sjn-c-subj-chem','Physics':'sjn-c-subj-phys','English':'sjn-c-subj-eng','Logical Reasoning':'sjn-c-subj-lr'}[x]||'sjn-c-subj-mixed');
const label='Staging testing environment · Genome tests are real; the other sessions are illustrative. Production unchanged.';
const warn=()=>'<p class="sjn-c-preview-note">'+ico('circle-info')+' '+label+'</p>';
const findSession=id=>sessions.find(s=>s.id===id);
const stats=s=>{const done=s.tests.filter(t=>t.completion==='Completed').length;return{done,pct:s.tests.length?Math.round(done/s.tests.length*100):0};};
const badgeAvailability=x=>'<span class="sjn-c-test-status is-'+x.toLowerCase()+'">'+esc(x)+'</span>';
const badgeCompletion=x=>'<span class="sjn-c-completion is-'+x.toLowerCase().replaceAll(' ','-')+'">'+ico(x==='Completed'?'circle-check':x==='In Progress'?'rotate':'circle')+' '+esc(x)+'</span>';
function sessionCard(s){
 const st=stats(s);
 return '<article class="sjn-c-session-card'+(s.enrolled?'':' is-explore')+'">'+
 (s.enrolled?'<button type="button" class="sjn-c-card-overlay" data-c-session="'+s.id+'" aria-label="Open '+esc(s.name)+'"></button>':'')+
 '<div class="sjn-c-card-top"><span class="sjn-c-kicker">'+ico('bolt')+' SJN MedNest Academy · MDCAT 2026</span><span class="sjn-c-status'+(s.enrolled?'':' is-explore')+'">'+ico(s.enrolled?'circle-check':'lock')+' '+(s.enrolled?'Enrolled':'Not Enrolled')+'</span></div>'+
 '<div><h4 class="sjn-c-card-title">'+esc(s.name)+'</h4><p class="sjn-c-card-sub">'+esc(s.description)+'</p></div>'+
 '<div class="sjn-c-card-info"><span>'+ico('layer-group')+' '+s.tests.length+' Tests</span><span>'+ico('calendar')+' '+esc(s.duration)+'</span><span>'+ico('list-check')+' '+esc(s.type)+'</span></div>'+
 '<div class="sjn-c-card-foot"><span class="sjn-c-progress"><span class="sjn-c-progress-head"><span>'+(s.enrolled?'Progress: '+st.done+' of '+s.tests.length+' completed':'Enrollment required')+'</span>'+
 '<span class="sjn-c-bar" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+(s.enrolled?st.pct:0)+'"><span style="width:'+(s.enrolled?st.pct:0)+'%"></span></span><strong>'+(s.enrolled?st.pct+'%':'Locked')+'</strong></span></span>'+
 '<span class="sjn-c-card-buttons"><button type="button" class="sjn-c-details-btn" data-c-details="'+s.id+'">Details</button>'+(s.enrolled?'<span class="sjn-c-card-action">View Session '+ico('arrow-right')+'</span>':'<span class="sjn-c-locked-btn">'+ico('lock')+' Locked</span>')+'</span></div></article>';
}
function home(){
 root.innerHTML='<div class="sjn-c-page"><header class="sjn-c-heading"><div><p class="sjn-c-eyebrow">'+ico('graduation-cap')+' SJN MedNest Academy · Test Sessions</p><h2 class="sjn-c-page-title">My Courses</h2><p class="sjn-c-lead">Access your enrolled test sessions and explore more sessions.</p></div></header>'+warn()+
 '<section class="sjn-c-section"><div class="sjn-c-section-head"><div><h3>My Enrolled Sessions</h3><p>Your sessions and upcoming academy-prepared tests.</p></div><span class="sjn-c-count">2 sessions</span></div><div class="sjn-c-session-grid">'+sessions.filter(s=>s.enrolled).map(sessionCard).join('')+'</div></section>'+
 '<section class="sjn-c-section"><div class="sjn-c-section-head"><div><h3>Explore Other Sessions</h3><p>Discover other available academy test sessions.</p></div><span class="sjn-c-count">1 session</span></div><div class="sjn-c-session-grid">'+sessions.filter(s=>!s.enrolled).map(sessionCard).join('')+'</div></section></div>';
}
const filterNames=['All','Available','Unattempted','Upcoming','Completed'];
function matches(t,filter){
 if(filter==='All')return true;
 if(filter==='Available')return t.availability==='Available'; // includes completed and in-progress
 if(filter==='Unattempted')return t.availability==='Available'&&t.completion==='Not Attempted';
 if(filter==='Upcoming')return t.availability==='Upcoming';
 if(filter==='Completed')return t.completion==='Completed';
 return false;
}
function testRow(t){
 return '<button type="button" class="sjn-c-test-row" data-c-test="'+t.no+'" aria-label="Open '+esc(t.name)+' details">'+
 '<span class="sjn-c-test-number">'+String(t.no).padStart(2,'0')+'</span><span class="sjn-c-test-main">'+
 '<span class="sjn-c-test-name">'+esc(t.name)+'</span><span class="sjn-c-test-meta"><span class="sjn-c-test-date">'+ico('calendar-days')+' '+esc(t.date)+'</span>'+
 '<span>'+ico('list-ol')+' '+t.count+' MCQs</span><span class="sjn-c-subject-tag '+subjectClass(t.subject)+'">'+ico('book-open')+' '+esc(t.subject)+'</span></span>'+
 '<span class="sjn-c-test-completion">'+badgeCompletion(t.completion)+'</span></span>'+
 '<span class="sjn-c-test-status-wrap">'+badgeAvailability(t.availability)+'</span><span class="sjn-c-test-arrow">'+ico('chevron-right')+'</span></button>';
}
function sessionPage(){
 const s=findSession(state.session);if(!s)return home();
 if(!s.enrolled){state.session=null;return home();} // UI preview only; real backend must enforce enrollment later.
 const st=stats(s),visible=s.tests.filter(t=>matches(t,state.filter));
 root.innerHTML='<div class="sjn-c-page"><button type="button" class="sjn-c-back" data-c-back="home">'+ico('arrow-left')+' All Sessions</button>'+
 '<div class="sjn-c-session-hero"><div class="sjn-c-hero-row"><div class="sjn-c-hero-copy"><span class="sjn-c-kicker">SJN MedNest Academy · '+esc(s.type)+'</span><h2 class="sjn-c-hero-title">'+esc(s.name)+'</h2><p class="sjn-c-hero-desc">'+esc(s.description)+'</p>'+
 '<div class="sjn-c-stats"><span class="sjn-c-stat">'+ico('file-lines')+' <strong>'+s.tests.length+'</strong> Tests</span><span class="sjn-c-stat">'+ico('calendar')+' '+esc(s.duration)+'</span><span class="sjn-c-stat">'+ico('chart-line')+' Progress <strong>'+st.pct+'%</strong></span></div></div>'+
 '<button type="button" class="sjn-c-hero-details" data-c-details="'+s.id+'">Session Details</button></div></div>'+warn()+
 '<div class="sjn-c-test-head"><div><h3 class="sjn-c-content-title">Session Tests</h3><p class="sjn-c-dim">Select a test to see its schedule and syllabus.</p></div><span class="sjn-c-count">'+s.tests.length+' Tests</span></div>'+
 '<div class="sjn-c-filter-row">'+filterNames.map(f=>'<button type="button" class="sjn-c-filter" data-c-filter="'+f+'" aria-pressed="'+(f===state.filter)+'">'+f+' <span class="sjn-c-filter-count">'+s.tests.filter(t=>matches(t,f)).length+'</span></button>').join('')+'</div>'+
 '<div class="sjn-c-tests">'+(visible.length?visible.map(testRow).join(''):'<div class="sjn-c-empty">'+(s.id==='genome'&&!state.genomeLoaded?'Loading published course tests…':state.genomeError?'Unable to load tests. Please reopen My Courses.':'No tests match this filter.')+'</div>')+'</div></div';
}
function syllabusHTML(t){
 if(t.fullSyllabus)return '<div class="sjn-c-full-syllabus">'+ico('book-open')+' Full Syllabus</div>';
 return Object.entries(t.syllabus).map(([subject,chs])=>'<details class="sjn-c-syllabus-group '+subjectClass(subject)+'" open><summary>'+esc(subject)+' <span class="sjn-c-chapter-count">'+chs.length+' chapter'+(chs.length===1?'':'s')+'</span></summary><ul class="sjn-c-syllabus-list">'+chs.map(ch=>'<li>'+esc(ch)+'</li>').join('')+'</ul></details>').join('');
}
function modeHTML(mode){
 return '<button type="button" class="sjn-c-mode-card'+(state.mode===mode?' is-active':'')+'" data-c-mode="'+mode+'" aria-pressed="'+(state.mode===mode)+'"><span class="sjn-c-mode-top">'+ico(mode==='timed'?'stopwatch':'graduation-cap')+ico(state.mode===mode?'circle-check':'circle')+'</span><strong>'+(mode==='timed'?'Timed Mode':'Tutor Mode')+'</strong><span>'+(mode==='timed'?'Exam-style test':'Instant feedback and explanations')+'</span></button>';
}
function testPage(){
 const s=findSession(state.session),t=s?.tests.find(x=>x.no===state.test);if(!t||!s.enrolled)return sessionPage();
 const selected=x=>state.testTab===x?' is-selected':'';
 root.innerHTML='<div class="sjn-c-page"><button type="button" class="sjn-c-back" data-c-back="session">'+ico('arrow-left')+' '+esc(s.name)+'</button>'+
 '<p class="sjn-c-eyebrow">'+ico('clipboard-list')+' Test '+String(t.no).padStart(2,'0')+'</p><h2 class="sjn-c-page-title">'+esc(t.name)+'</h2>'+
 '<p class="sjn-c-lead">Review the test information and syllabus before starting.</p>'+warn()+
 '<div class="sjn-c-test-tabs"><button type="button" class="sjn-c-test-tab'+selected('overview')+'" data-c-test-tab="overview" aria-pressed="'+(state.testTab==='overview')+'">Test Overview</button><button type="button" class="sjn-c-test-tab'+selected('syllabus')+'" data-c-test-tab="syllabus" aria-pressed="'+(state.testTab==='syllabus')+'">Syllabus</button></div>'+
 '<div class="sjn-c-detail-layout"><section class="sjn-c-detail-panel'+selected('overview')+'" data-c-test-panel="overview">'+
 '<h3 class="sjn-c-detail-title">Test Overview</h3><div class="sjn-c-detail-meta"><div class="sjn-c-detail-metric"><small>Questions</small><strong>'+t.count+'</strong></div>'+
 '<div class="sjn-c-detail-metric"><small>Duration</small><strong>'+t.minutes+' min</strong></div><div class="sjn-c-detail-metric"><small>Availability</small><strong>'+badgeAvailability(t.availability)+'</strong></div></div>'+
 '<div class="sjn-c-overview-info"><span class="sjn-c-test-schedule">'+ico('calendar-days')+' Scheduled: '+esc(t.date)+'</span><span>'+ico('book-open')+' '+esc(t.subject)+'</span><span>Attempt status: '+badgeCompletion(t.completion)+'</span></div>'+
 '<h4 class="sjn-c-mode-title">Select Test Mode</h4><div class="sjn-c-modes">'+modeHTML('timed')+modeHTML('tutor')+'</div>'+
 '<button class="sjn-c-launch" type="button" data-c-start="'+t.id+'"'+(t.availability!=='Available'?' disabled aria-label="Test is not available"':'')+'>Start Test '+ico('arrow-right')+'</button></section>'+
 '<section class="sjn-c-detail-panel'+selected('syllabus')+'" data-c-test-panel="syllabus"><h3 class="sjn-c-detail-title">Test Syllabus</h3>'+
 (t.fullSyllabus?'':'<p class="sjn-c-dim" style="margin:0 0 14px">Subjects and chapters included in this test.</p>')+syllabusHTML(t)+'</section></div></div>';
}
function modalHTML(s){
 const rows=s.tests.map(t=>'<li><span class="sjn-c-modal-test-no">'+String(t.no).padStart(2,'0')+'</span><span class="sjn-c-modal-test-title">'+esc(t.name)+'</span><span class="sjn-c-modal-test-date">'+esc(t.date)+'</span></li>').join('');
 return '<div class="sjn-c-modal-backdrop" data-c-modal-backdrop><div class="sjn-c-dialog" role="dialog" aria-modal="true" aria-labelledby="sjn-c-dialog-title">'+
 '<div class="sjn-c-dialog-header"><div><p class="sjn-c-eyebrow">SJN MedNest Academy · Session</p><h2 id="sjn-c-dialog-title">'+esc(s.name)+'</h2></div><button type="button" class="sjn-c-dialog-close" data-c-modal-close aria-label="Close session details">×</button></div>'+
 '<div class="sjn-c-dialog-tabs"><button type="button" class="sjn-c-dialog-tab'+(state.modalTab==='details'?' is-active':'')+'" data-c-modal-tab="details" aria-pressed="'+(state.modalTab==='details')+'">Session Details</button><button type="button" class="sjn-c-dialog-tab'+(state.modalTab==='schedule'?' is-active':'')+'" data-c-modal-tab="schedule" aria-pressed="'+(state.modalTab==='schedule')+'">Schedule</button></div>'+
 '<div class="sjn-c-dialog-content">'+(state.modalTab==='details'?'<h3>About this session</h3><p class="sjn-c-dialog-intro">'+esc(s.description)+'</p><dl class="sjn-c-modal-facts"><div><dt>Session type</dt><dd>'+esc(s.type)+'</dd></div><div><dt>Duration</dt><dd>'+esc(s.duration)+'</dd></div><div><dt>Tests</dt><dd>'+s.tests.length+' tests</dd></div><div><dt>Access</dt><dd>'+(s.enrolled?'Enrolled':'Not enrolled · Locked')+'</dd></div></dl>':'<h3>Test Schedule</h3><p class="sjn-c-dialog-intro">Scheduled tests in order.</p><ol class="sjn-c-modal-schedule">'+rows+'</ol>')+'</div>'+
 '<div class="sjn-c-dialog-foot"><span>'+(s.enrolled?'Enrolled':'Enrollment required for test access')+'</span><button type="button" data-c-modal-close>Close</button></div></div></div>';
}
function closeDialog(){
 root.querySelector('[data-c-modal-backdrop]')?.remove();document.body.classList.remove('sjn-c-dialog-open');state.modal=null;
 const el=state.focus;state.focus=null;if(el?.isConnected)el.focus();
}
function openDialog(id,el){
 const s=findSession(id);if(!s)return;
 state.modal=id;state.modalTab='details';state.focus=el;root.insertAdjacentHTML('beforeend',modalHTML(s));
 document.body.classList.add('sjn-c-dialog-open');root.querySelector('[data-c-modal-close]')?.focus();
}
function changeModalTab(tab){
 if(!state.modal||!['details','schedule'].includes(tab))return;
 state.modalTab=tab;root.querySelector('[data-c-modal-backdrop]')?.remove();
 root.insertAdjacentHTML('beforeend',modalHTML(findSession(state.modal)));
 root.querySelector('[data-c-modal-tab="'+tab+'"]')?.focus();
}
function switchTestTab(tab){
 if(!['overview','syllabus'].includes(tab))return;state.testTab=tab;
 root.querySelectorAll('[data-c-test-tab]').forEach(x=>{const on=x.dataset.cTestTab===tab;x.classList.toggle('is-selected',on);x.setAttribute('aria-pressed',String(on));});
 root.querySelectorAll('[data-c-test-panel]').forEach(x=>x.classList.toggle('is-selected',x.dataset.cTestPanel===tab));
}
async function refresh(){
 if(state.loading || !window.SJNCourseBridge?.load)return;
 state.loading=true;state.genomeError=null;
 try{
  const result=await window.SJNCourseBridge.load();
  if(!result||!Array.isArray(result.tests)||result.session!=='genome')throw Error('Invalid course response');
  const genome=findSession('genome');
  genome.tests=result.tests.map(t=>({
   ...t,date:'Available on demand',count:t.mcqIds.length,
   fullSyllabus:t.fullSyllabus===true
  }));
  state.genomeLoaded=true;
  if(state.test!==null&&state.session==='genome'&&!genome.tests.some(t=>t.no===state.test))state.test=null;
  if(!state.modal)render();
 }catch(e){state.genomeError=e?.message||'Unable to load';if(!state.modal)render();}
 finally{state.loading=false;}
}
function render(){if(state.modal)closeDialog();if(state.test!==null)testPage();else if(state.session)sessionPage();else home();}
root.addEventListener('click',e=>{
 const bg=e.target.closest('[data-c-modal-backdrop]');if(bg&&e.target===bg){closeDialog();return;}
 if(e.target.closest('[data-c-modal-close]')){closeDialog();return;}
 const mt=e.target.closest('[data-c-modal-tab]');if(mt){changeModalTab(mt.dataset.cModalTab);return;}
 const details=e.target.closest('[data-c-details]');if(details){openDialog(details.dataset.cDetails,details);return;}
 const tab=e.target.closest('[data-c-test-tab]');if(tab){switchTestTab(tab.dataset.cTestTab);return;}
 const start=e.target.closest('[data-c-start]');if(start){if(state.launching||!window.SJNCourseBridge?.start)return;state.launching=true;start.disabled=true;void window.SJNCourseBridge.start(Number(start.dataset.cStart),state.mode).then(ok=>{if(!ok){window.alert('This course test could not be started. Check your login and reload.');start.disabled=false;}}).catch(err=>{window.alert(err?.message||'Unable to start course test');start.disabled=false;}).finally(()=>{state.launching=false;});return;}
 const mode=e.target.closest('[data-c-mode]');if(mode){if(!['timed','tutor'].includes(mode.dataset.cMode))return;state.mode=mode.dataset.cMode;root.querySelectorAll('[data-c-mode]').forEach(x=>{const active=x.dataset.cMode===state.mode;x.classList.toggle('is-active',active);x.setAttribute('aria-pressed',String(active));const symbols=x.querySelectorAll('.sjn-c-mode-top i');if(symbols[1])symbols[1].className='fa-solid fa-'+(active?'circle-check':'circle');});return;}
 const back=e.target.closest('[data-c-back]');if(back){if(back.dataset.cBack==='home'){state.session=null;state.test=null;}else state.test=null;state.filter='All';state.testTab='overview';render();return;}
 const session=e.target.closest('[data-c-session]');if(session){const x=findSession(session.dataset.cSession);if(!x?.enrolled)return;state.session=x.id;state.test=null;state.filter='All';render();return;}
 const filter=e.target.closest('[data-c-filter]');if(filter){state.filter=filter.dataset.cFilter;render();return;}
 const test=e.target.closest('[data-c-test]');if(test){state.test=Number(test.dataset.cTest);state.testTab='overview';state.mode='timed';render();}
});
document.addEventListener('keydown',e=>{
 if(!state.modal)return;
 if(e.key==='Escape'){e.preventDefault();closeDialog();return;}
 if(e.key!=='Tab')return;
 const buttons=[...root.querySelectorAll('[role="dialog"] button:not([disabled])')];if(!buttons.length)return;
 const first=buttons[0],last=buttons[buttons.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
window.SJNCoursesPreview=Object.freeze({render,refresh,closeDialog});
render();
})();