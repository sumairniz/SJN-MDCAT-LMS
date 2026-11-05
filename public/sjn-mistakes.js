/* SJN MedNest Mistake Diary — student-owned annotations on verified saved mistakes. */
(()=>{
'use strict';
const root=document.getElementById('module-mistakes');
if(!root)return;
const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const bridge=()=>window.SJNMistakesBridge;
const icon=n=>'<i class="fa-solid fa-'+n+'" aria-hidden="true"></i>';
const state={owner:null,source:'banks',subject:'',group:null,groups:[],totals:null,entries:[],total:0,
 page:1,category:'all',status:'all',query:'',expanded:null,phase:'idle',error:'',
 request:0,dirty:true,busy:false};
const sources=[['banks','Question Banks','book-open'],['courses','My Courses','graduation-cap'],['papers','Full-Length Past Papers','file-lines']];
const categories=[['information','Information Gap'],['conceptual','Conceptual Mistake'],['silly','Silly Mistake'],['retention','Retention Gap']];
const statuses=[['need-review','Need Review'],['in-progress','In Progress'],['mastered','Mastered']];
const subjectOrder=['Biology','Chemistry','Physics','English','Logical Reasoning'];
const subjectRank=name=>{const pos=subjectOrder.indexOf(String(name));return pos<0?subjectOrder.length:pos;};
const categoryTone=value=>['information','conceptual','silly','retention'].includes(value)?value:'uncategorized';
// Saving remains explicitly manual. Guard against dropping edits on in-page or sidebar navigation.
function hasUnsavedChanges(){
 const box=root.querySelector('[data-m-detail]');if(!box)return false;
 const entry=state.entries.find(e=>String(e.mcq_id)===box.dataset.mDetail);
 if(!entry)return false;
 return (box.querySelector('[data-m-edit="category"]')?.value||null)!==(entry.category||null)||
   (box.querySelector('[data-m-edit="status"]')?.value||'need-review')!==entry.review_status||
   (box.querySelector('[data-m-edit="note"]')?.value||'')!==(entry.learning_note||'');
}
function mayNavigate(){return !hasUnsavedChanges()||window.confirm('You have unsaved Mistake Diary changes. Discard them and continue?');}
const fmt=n=>Number(n||0).toLocaleString();
const tone=s=>({Biology:'bio',Chemistry:'chem',Physics:'phys',English:'eng','Logical Reasoning':'lr'}[s]||'mixed');
function groupKey(x){
 if(x.source_kind==='banks')return ['banks',x.subject,x.chapter].join('|');
 if(x.source_kind==='courses')return ['courses',x.course_test_id].join('|');
 return ['papers',x.paper_title].join('|');
}
function reset(){
 state.request++;state.owner=null;state.source='banks';state.subject='';state.group=null;
 state.groups=[];state.totals=null;state.entries=[];state.total=0;state.page=1;
 state.category='all';state.status='all';state.query='';state.expanded=null;
 state.phase='idle';state.error='';state.dirty=true;state.busy=false;root.replaceChildren();
}
function invalidate(){state.request++;state.dirty=true;state.group=null;state.entries=[];state.phase='idle';}
function header(){return '<header class="sjn-m-head"><div class="sjn-m-heading">'+
 '<div class="sjn-m-eyebrow">'+icon('book-open-reader')+' <span>LEARNING JOURNAL</span></div>'+
 '<h2>Mistake Diary</h2><p>Understand your mistakes. Strengthen your preparation.</p>'+
 '</div></header>'}
function metric(name,n,desc,ico,t){return '<div class="sjn-m-stat" data-tone="'+t+'">'+
 '<span class="sjn-m-stat-icon">'+icon(ico)+'</span><span>'+html(name)+'</span>'+
 '<strong>'+fmt(n)+'</strong><small>'+html(desc)+'</small></div>';}
function summary(){
 const t=state.totals||{};
 return '<div class="sjn-m-stats">'+
 metric('Total Mistakes',t.total,'Unique questions','clipboard-list','blue')+
 metric('Need Review',t.need_review,'Start here','circle-exclamation','amber')+
 metric('In Progress',t.in_progress,'Learning in progress','arrows-rotate','purple')+
 metric('Mastered',t.mastered,'May be revisited','circle-check','teal')+'</div>';
}
function tabs(){return '<nav class="sjn-m-tabs" aria-label="Mistake sources">'+sources.map(([id,name,ico])=>
 '<button type="button" data-m-tab="'+id+'" class="'+(state.source===id?'is-active':'')+'" aria-current="'+(state.source===id?'page':'false')+'">'+icon(ico)+'<span>'+name+'</span></button>').join('')+'</nav>'}
function filters(){
 const status='<label>Review status<select data-m-filter="status">'+
 [['all','All statuses'],...statuses].map(([v,s])=>'<option value="'+v+'"'+(state.status===v?' selected':'')+'>'+s+'</option>').join('')+
 '</select></label>';
 const categorySelect='<label class="sjn-m-mobile-category">Mistake type<select data-m-filter="category">'+
 [['all','All categories'],...categories].map(([v,s])=>'<option value="'+v+'"'+(state.category===v?' selected':'')+'>'+s+'</option>').join('')+
 '</select></label>';
 const chips='<div class="sjn-m-desktop-categories" role="group" aria-label="Filter by mistake category">'+
 [['all','All Categories'],...categories].map(([v,n])=>
 '<button type="button" class="sjn-m-category-chip'+(state.category===v?' active':'')+
 '" data-category="'+categoryTone(v)+'" data-m-category="'+v+'" aria-pressed="'+(state.category===v)+'">'+html(n)+'</button>').join('')+'</div>';
 return '<div class="sjn-m-filter-layout"><div class="sjn-m-filters">'+status+categorySelect+'</div>'+chips+'</div>';
}
function option(label,idx,e){
 let status=idx===e.correct_index?'correct':idx===e.selected_index?'wrong':'neutral';
 return '<div class="sjn-m-option" data-answer="'+status+'"><span class="sjn-m-option-letter">'+
 'ABCD'[idx]+'</span><span>'+html(label)+'</span>'+
 (status==='correct'?'<span class="sjn-m-option-result">'+icon('check')+' Correct</span>':
  status==='wrong'?'<span class="sjn-m-option-result">'+icon('xmark')+' Your answer</span>':'')+'</div>';
}
function expanded(e){
 const c=categories.map(([v,n])=>'<option value="'+v+'"'+(e.category===v?' selected':'')+'>'+n+'</option>').join('');
 const s=statuses.map(([v,n])=>'<option value="'+v+'"'+(e.review_status===v?' selected':'')+'>'+n+'</option>').join('');
 const i=state.entries.findIndex(x=>String(x.mcq_id)===String(e.mcq_id));
 return '<div class="sjn-m-detail" data-m-detail="'+html(e.mcq_id)+'">'+
 '<div class="sjn-m-choices">'+e.options_json.map((o,n)=>option(o,n,e)).join('')+'</div>'+
 '<section class="sjn-m-explain"><h4>'+icon('lightbulb')+' Explanation</h4>'+
 '<p>'+html(e.explanation||'An explanation is not available for this question.')+'</p>'+
 (e.mnemonic?'<p class="sjn-m-mnemonic">'+icon('brain')+' '+html(e.mnemonic)+'</p>':'')+'</section>'+
 '<div class="sjn-m-editor"><label>Why did this happen?<select data-m-edit="category">'+
 '<option value=""'+(e.category===null?' selected':'')+'>Not Categorized</option>'+c+'</select></label>'+
 '<label>Review status<select data-m-edit="status">'+s+'</select></label>'+
 '<label class="sjn-m-note"><span class="sjn-m-note-caption">My Learning Note <small>(optional)</small></span><textarea data-m-edit="note" maxlength="1200" rows="3" placeholder="What will help you avoid this mistake next time?">'+
 html(e.learning_note)+'</textarea></label>'+
 '<div class="sjn-m-editor-footer"><small data-m-feedback aria-live="polite">Changes save only when you press Save.</small>'+
 '<button type="button" class="sjn-m-save" data-m-save="'+html(e.mcq_id)+'">'+icon('floppy-disk')+' Save Changes</button></div></div>'+
 '<div class="sjn-m-next">'+
 '<button type="button" data-m-prev '+(i===0?'disabled':'')+'>'+icon('arrow-left')+' Previous</button>'+
 '<span>'+fmt(i+1)+' of '+fmt(state.entries.length)+' on this page</span>'+
 '<button type="button" data-m-next '+(i===state.entries.length-1?'disabled':'')+'>Next '+icon('arrow-right')+'</button></div>'+
 '</div>';
}
function entry(e,i){
 const label=e.source_kind==='banks'?
  (e.bank==='Past Papers Question Bank'?'Past Papers Question Bank':e.bank||'SJN Question Bank'):
  e.source_kind==='courses'?(e.course_title||'Course Test'):(e.paper_title||'Past Paper');
 const status=statuses.find(x=>x[0]===e.review_status)?.[1]||'Need Review';
 const category=categories.find(x=>x[0]===e.category)?.[1]||'Not Categorized';
 const open=String(e.mcq_id)===String(state.expanded);
 return '<article class="sjn-m-question" data-m-id="'+html(e.mcq_id)+'" data-subject="'+tone(e.subject)+'">'+
 '<button type="button" class="sjn-m-question-top" data-m-expand="'+html(e.mcq_id)+'" aria-expanded="'+open+'">'+
 '<div class="sjn-m-line"><span class="sjn-m-qno">Q'+(i+1+(state.page-1)*20)+'</span>'+
 '<span class="sjn-m-source">'+html(label)+'</span>'+
 '<span class="sjn-m-status" data-status="'+html(e.review_status)+'">'+html(status)+'</span></div>'+
 '<div class="sjn-m-qbody">'+html(e.question)+'</div>'+
 '<div class="sjn-m-badges"><span>'+html(e.subject)+'</span>'+
 (e.chapter?'<span>'+html(e.chapter)+'</span>':'')+
 (e.topic?'<span>Topic: '+html(e.topic)+'</span>':'')+
 '<span class="sjn-m-category" data-category="'+categoryTone(e.category)+'">'+html(category)+'</span>'+
 (Number(e.wrong_count)>1?'<span>'+fmt(e.wrong_count)+' incorrect attempts</span>':'')+
 '</div><span class="sjn-m-open">'+(open?'Hide details':'Review mistake')+' '+icon(open?'chevron-up':'chevron-down')+'</span></button>'+
 (open?expanded(e):'')+'</article>';
}
function tree(){
 const groups=state.groups.filter(x=>x.source_kind===state.source);
 if(!groups.length)return '<div class="sjn-m-empty">'+icon('circle-check')+
 '<h3>No saved mistakes here yet</h3><p>Incorrect answers from successfully submitted tests appear automatically.</p></div>';
 if(state.source==='banks'&&!state.subject){
  const map=new Map();
  for(const g of groups)map.set(g.subject,(map.get(g.subject)||0)+Number(g.mistake_count));
  return '<div class="sjn-m-tree">'+[...map.entries()].sort((a,b)=>subjectRank(a[0])-subjectRank(b[0])||a[0].localeCompare(b[0]))
   .map(([name,n])=>'<button class="sjn-m-group" data-m-subject="'+html(name)+'" data-subject="'+tone(name)+'">'+
    '<span class="sjn-m-group-icon">'+icon({bio:'dna',chem:'flask',phys:'atom',eng:'book-open',lr:'brain'}[tone(name)]||'book')+'</span>'+
    '<span class="sjn-m-group-text"><strong>'+html(name)+'</strong><small>View mistakes by chapter</small></span>'+
    '<span class="sjn-m-count">'+fmt(n)+'</span>'+icon('chevron-right')+'</button>').join('')+'</div>';
 }
 const list=state.source==='banks'?groups.filter(g=>g.subject===state.subject):groups;
 const rows=state.source==='courses'?list.sort((a,b)=>String(a.course_title).localeCompare(String(b.course_title))||String(a.test_title).localeCompare(String(b.test_title))):
  list.sort((a,b)=>String(a.chapter||a.paper_title).localeCompare(String(b.chapter||b.paper_title)));
 return '<div class="sjn-m-tree">'+rows.map(g=>{
  const title=state.source==='banks'?(g.chapter||'General Chapter'):
   state.source==='courses'?(g.test_title||'Course Test'):(g.paper_title||'Past Paper');
  const sub=state.source==='banks'?'All incorrect MCQs · topics displayed inside':
   state.source==='courses'?(g.course_title||'Course Tests'):'Original examination paper';
  return '<button class="sjn-m-group" data-m-group="'+html(groupKey(g))+'" data-subject="'+tone(g.subject)+'">'+
   '<span class="sjn-m-group-icon">'+icon(state.source==='banks'?'layer-group':state.source==='courses'?'graduation-cap':'file-lines')+'</span>'+
   '<span class="sjn-m-group-text"><strong>'+html(title)+'</strong><small>'+html(sub)+'</small></span>'+
   '<span class="sjn-m-count">'+fmt(g.mistake_count)+'</span>'+icon('chevron-right')+'</button>';
 }).join('')+'</div>';
}
function breadcrumbs(){
 if(!state.group&&!state.subject)return '';
 const back='<button type="button" class="sjn-m-back-button" data-m-back="previous">'+icon('arrow-left')+' Back</button>';
 return '<div class="sjn-m-crumb">'+back+'<button data-m-back="root">'+icon('house')+' All '+html(sources.find(s=>s[0]===state.source)?.[1])+'</button>'+
 (state.source==='banks'&&state.subject?'<span>/</span><button data-m-back="subject">'+html(state.subject)+'</button>':'')+
 (state.group?'<span>/</span><strong>'+html(state.source==='banks'?(state.group.chapter||'General Chapter'):
    state.source==='courses'?state.group.test_title:state.group.paper_title)+'</strong>':'')+'</div>';
}
function list(){
 return '<div class="sjn-m-listhead"><div><h3>Saved Mistakes</h3><p>'+fmt(state.total)+
 ' question'+(state.total===1?'':'s')+' matching your filters</p></div>'+filters()+'</div>'+
 (state.entries.length?'<div class="sjn-m-questions">'+state.entries.map(entry).join('')+'</div>':
  '<div class="sjn-m-empty">'+icon('magnifying-glass')+'<h3>No matching questions</h3><p>Try another review status or mistake category.</p></div>')+
 (state.total>20?'<div class="sjn-m-page"><button data-m-page="prev" '+(state.page===1?'disabled':'')+'>'+
 icon('arrow-left')+' Previous</button><span>Page '+fmt(state.page)+' of '+fmt(Math.ceil(state.total/20))+
 '</span><button data-m-page="next" '+(state.page*20>=state.total?'disabled':'')+'>Next '+icon('arrow-right')+'</button></div>':'');
}
function render(){
 let body='';
 if(state.phase==='loading')body='<div class="sjn-m-wait">'+icon('spinner fa-spin')+' Loading verified student mistakes…</div>';
 else if(state.phase==='error')body='<div class="sjn-m-empty"><h3>Could not load Mistake Diary</h3><p>'+
 html(state.error||'Please retry.')+'</p><button data-m-retry>Retry</button></div>';
 else if(state.totals){
  body=summary()+tabs()+'<section class="sjn-m-panel">'+breadcrumbs()+
   (state.group?list():tree())+'</section>';
 }
 root.innerHTML=header()+body;
}
function basePath(){
 if(!state.group)return '';
 const g=state.group;
 const q=new URLSearchParams({source:state.source,page:String(state.page),status:state.status,category:state.category});
 if(state.source==='banks'){q.set('subject',g.subject);q.set('chapter',g.chapter||'');}
 else if(state.source==='courses')q.set('courseTestId',String(g.course_test_id));
 else q.set('paperTitle',g.paper_title);
 return '/mistake-diary/entries?'+q.toString();
}
async function catalog(force=false){
 const uid=bridge()?.userId?.();if(!uid){reset();return}
 if(state.owner!==uid){reset();state.owner=uid;}
 if(!force&&!state.dirty&&state.totals){if(!root.querySelector('[data-m-detail]'))render();return;}
 const ticket=++state.request;state.phase='loading';render();
 try{
  const d=await bridge().load('/mistake-diary/catalog');
  if(ticket!==state.request||uid!==bridge()?.userId?.())return;
  if(d?.userId!==uid||!Array.isArray(d.groups)||!d.totals||!Number.isInteger(d.totals.total))throw Error('Incomplete Diary catalog');
  state.totals=d.totals;state.groups=d.groups;state.dirty=false;state.phase='ready';
  // Do not retain a stale group after newly submitted tests or account changes.
  if(state.group){
   const target=state.groups.find(g=>groupKey(g)===groupKey(state.group));
   state.group=target||null;
   if(target){await entries();return;}
  }
  render();
 }catch(e){if(ticket!==state.request||uid!==bridge()?.userId?.())return;
  state.phase='error';state.error=e?.message||'Please try again.';render();}
}
async function entries(){
 const uid=bridge()?.userId?.();if(!uid||!state.group)return;
 const ticket=++state.request;state.phase='loading';render();
 try{
  const d=await bridge().load(basePath());
  if(ticket!==state.request||uid!==bridge()?.userId?.())return;
  if(d?.userId!==uid||!Array.isArray(d.entries)||!Number.isInteger(d.total))throw Error('Incomplete saved mistakes');
  state.entries=d.entries;state.total=d.total;state.expanded=null;state.phase='ready';render();
 }catch(e){if(ticket!==state.request||uid!==bridge()?.userId?.())return;
  state.phase='error';state.error=e?.message||'Please retry.';render();}
}
async function save(id){
 if(state.busy)return;
 const uid=bridge()?.userId?.();
 const entry=state.entries.find(x=>String(x.mcq_id)===String(id)),box=root.querySelector('[data-m-detail="'+id+'"]');
 if(!uid||!entry||!box)return;
 const category=box.querySelector('[data-m-edit="category"]').value||null,
 note=box.querySelector('[data-m-edit="note"]').value,
 reviewStatus=box.querySelector('[data-m-edit="status"]').value;
 const feedback=box.querySelector('[data-m-feedback]'),button=box.querySelector('[data-m-save]');
 if(note.length>1200)return;
 state.busy=true;button.disabled=true;feedback.textContent='Saving…';
 try{
  const d=await bridge().send('/mistake-diary/annotations/'+id,{method:'PUT',body:{category,learningNote:note,reviewStatus}});
  if(uid!==bridge()?.userId?.())return;
  if(!d?.saved||d?.userId!==uid||String(d.annotation?.mcq_id)!==String(id))throw Error('Save could not be verified');
  entry.category=d.annotation.category;entry.learning_note=d.annotation.learning_note;
  entry.review_status=d.annotation.review_status;
  state.dirty=true;
  // Re-query the summary so that review-status counts and grouped data remain authoritative.
  try{
   const cd=await bridge().load('/mistake-diary/catalog');
   if(uid!==bridge()?.userId?.())return;
   if(cd?.userId===uid&&cd.totals&&Array.isArray(cd.groups)){
    state.totals=cd.totals;state.groups=cd.groups;state.dirty=false;
   }
  }catch(_){/* Annotation was confirmed; summary can retry independently. */}
  render();
  const msg=root.querySelector('[data-m-detail="'+id+'"] [data-m-feedback]');
  if(msg)msg.textContent='Changes saved securely.';
 }catch(e){if(uid!==bridge()?.userId?.())return;
  feedback.textContent=e?.message||'Save failed. Please retry.';
 }finally{state.busy=false;if(button?.isConnected)button.disabled=false;}
}
root.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||!root.contains(button)||state.busy)return;
 const action=button.dataset;
 if(action.mRetry!==undefined){if(mayNavigate())void catalog(true);return;}
 if(action.mCategory){if(state.group&&state.category!==action.mCategory&&mayNavigate()){state.category=action.mCategory;state.page=1;void entries();}return;}
 if(!mayNavigate())return;
 if(action.mTab){state.source=action.mTab;state.subject='';state.group=null;state.page=1;state.category='all';state.status='all';render();return;}
 if(action.mSubject){state.subject=action.mSubject;render();return;}
 if(action.mGroup){
  state.group=state.groups.find(g=>groupKey(g)===action.mGroup)||null;
  state.page=1;state.category='all';state.status='all';
  if(state.group)void entries();return;
 }
 if(action.mBack==='previous'){
  if(state.group){state.group=null;}else{state.subject='';}
  state.expanded=null;render();return;
 }
 if(action.mBack==='root'){state.group=null;state.subject='';render();return;}
 if(action.mBack==='subject'){state.group=null;render();return;}
 if(action.mExpand){
  state.expanded=String(state.expanded)===action.mExpand?null:action.mExpand;render();return;
 }
 if(action.mSave){void save(action.mSave);return;}
 if(action.mPage){state.page+=action.mPage==='next'?1:-1;void entries();return;}
 if(action.mNext!==undefined||action.mPrev!==undefined){
  const at=state.entries.findIndex(e=>String(e.mcq_id)===String(state.expanded));
  const next=state.entries[at+(action.mNext!==undefined?1:-1)];
  if(next){state.expanded=String(next.mcq_id);render();root.querySelector('[data-m-id="'+state.expanded+'"]')?.scrollIntoView({behavior:'smooth',block:'nearest'});}return;
 }
});
root.addEventListener('change',event=>{
 const filter=event.target.dataset.mFilter;
 if(!state.group||!filter)return;
 if(!mayNavigate()){
  event.target.value=filter==='status'?state.status:state.category;
  return;
 }
 if(filter==='status')state.status=event.target.value;
 if(filter==='category')state.category=event.target.value;
 state.page=1;void entries();
});
window.SJNMistakes={enter:()=>catalog(),reset,invalidate,canLeave:mayNavigate};
})();
