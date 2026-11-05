/* SJN MedNest Dashboard — authenticated, read-only summary with verified daily quotations.
 * Independent of the finalized Analytics component. No grading or draft writes.
 */
(()=>{
'use strict';
const root=document.getElementById('module-dashboard');
if(!root)return;
const $=id=>document.getElementById(id);
const bridge=()=>window.SJNDashboardBridge;
const fmt=value=>Number(value||0).toLocaleString();
const valueNumber=value=>Number.isFinite(Number(value))?Number(value):0;
const accuracy=(correct,answered)=>answered>0?(100*correct/answered).toFixed(1).replace(/\.0$/,'')+'%':'—';
const subjects=[
 {id:'bio',name:'Biology'},
 {id:'chem',name:'Chemistry'},
 {id:'phys',name:'Physics'},
 {id:'eng',name:'English'},
 {id:'lr',name:'Logical Reasoning'}
];
// A conservative starting set. Each quotation was checked against the named
// source and is linked directly. Historical Osler writings are public domain.
// Do not add unverified quotes or invented authors.
const osler='https://www.osler.org.uk/oslers-aphorisms';
const quotes=[
 {text:'The value of experience is not in seeing much, but in seeing wisely.',author:'Sir William Osler',source:osler,band:'all'},
 {text:'We are here to add what we can to life, not to get what we can from life.',author:'Sir William Osler',source:osler,band:'all'},
 {text:'The good physician treats the disease; the great physician treats the patient who has the disease.',author:'Sir William Osler',source:osler,band:'high'},
 {text:'Live neither in the past nor in the future, but let each day’s work absorb your entire energies and satisfy your widest ambition.',author:'Sir William Osler',source:osler,band:'low'},
 {text:'Medicine is learned by the bedside and not in the classroom.',author:'Sir William Osler',source:osler,band:'mid'},
 {text:'But see first.',author:'Sir William Osler',source:osler,band:'high'},
 {text:'The practice of medicine is an art, not a trade; a calling, not a business.',author:'Sir William Osler',source:'https://www.acponline.org/about-acp/about-internal-medicine/sir-william-osler-and-internal-medicine',band:'all'},
 {text:'Nothing in life is to be feared, it is only to be understood.',author:'Marie Curie',source:'https://www.nobelprize.org/uploads/2025/04/annual-review-2024.pdf',band:'low'},
 {text:'The first principle is that you must not fool yourself—and you are the easiest person to fool.',author:'Richard P. Feynman',source:'https://calteches.library.caltech.edu/51/2/CargoCult.htm',band:'high'},
 {text:'Your time is limited, so don’t waste it living someone else’s life.',author:'Steve Jobs',source:'https://news.stanford.edu/stories/2005/06/steve-jobs-2005-graduates-stay-hungry-stay-foolish?view=print',band:'low'}
];
let owner=null,payload=null,cachedAt=0,request=null,serial=0,needsRefresh=true,historyOwner=null,saved=[];
function subjectName(raw){
 const k=String(raw||'').trim().toLowerCase();
 if(k==='biology'||k==='bio')return 'Biology';
 if(k==='chemistry'||k==='chem')return 'Chemistry';
 if(k==='physics'||k==='phys')return 'Physics';
 if(k==='english')return 'English';
 if(k==='logical reasoning'||k==='logicalreasoning')return 'Logical Reasoning';
 return null;
}
function selectDailyQuote(summary,uid){
 const answered=valueNumber(summary?.totals?.answered);
 const ratio=answered>0?valueNumber(summary.totals.correct)/answered:null;
 const band=answered<15?'low':ratio>=.8?'high':ratio>=.6?'mid':'low';
 const pool=quotes.filter(q=>q.band==='all'||q.band===band);
 // A quote remains stable for the same student during a local calendar day.
 const day=new Date().toLocaleDateString('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'});
 const input=uid+'|'+day+'|'+band;let hash=2166136261;
 for(const char of input){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
 return pool[(hash>>>0)%pool.length];
}
function renderQuote(summary,uid){
 const q=selectDailyQuote(summary,uid);
 const body=$('sjn-db-quote-text'),author=$('sjn-db-quote-author');
 if(body)body.textContent='“'+q.text+'”';
 if(author){author.textContent='— '+q.author+' · Source';author.href=q.source;}
}
function setText(id,text){const el=$(id);if(el)el.textContent=text;}
function renderTotals(data){
 const t=data.totals||{},answered=valueNumber(t.answered),correct=valueNumber(t.correct);
 const acc=answered>0?100*correct/answered:0;
 setText('dash-mcqs',fmt(answered));
 setText('dash-accuracy',accuracy(correct,answered));
 const bar=$('dash-accuracy-bar');if(bar)bar.style.width=Math.max(0,Math.min(acc,100))+'%';
 // The header and dashboard refer to the exact same answered-question metric.
 setText('nav-mcqs-count',fmt(answered));
 setText('nav-accuracy',accuracy(correct,answered));
 for(const subject of subjects){
  const rows=data.nodes.filter(x=>['sjn','pastbank','courses','papers'].includes(x.source_type)&&subjectName(x.subject)===subject.name);
  let a=0,c=0;
  for(const row of rows){a+=valueNumber(row.answered);c+=valueNumber(row.correct);}
  const percent=a>0?100*c/a:0;
  setText('subj-'+subject.id+'-acc',a>0?accuracy(c,a):'Not started');
  setText('subj-'+subject.id+'-count',a>0?fmt(a)+' answered · '+fmt(c)+' correct': 'No submitted answers yet');
  const track=$('subj-'+subject.id+'-bar');if(track)track.style.width=Math.max(0,Math.min(percent,100))+'%';
 }
}
function showUnavailable(){
 setText('dash-mcqs','—');setText('dash-accuracy','—');
 const bar=$('dash-accuracy-bar');if(bar)bar.style.width='0%';
 for(const subject of subjects){
  setText('subj-'+subject.id+'-acc','Unavailable');
  setText('subj-'+subject.id+'-count','');
  const track=$('subj-'+subject.id+'-bar');if(track)track.style.width='0%';
 }
 if($('sjn-db-error'))$('sjn-db-error').hidden=false;
}
function savedCard(){
 const card=$('sjn-db-resume');
 if(!card)return;
 const uid=bridge()?.userId?.();
 if(!uid||historyOwner!==uid){card.hidden=true;return}
 const draft=saved.find(x=>x?.status==='in-progress'&&typeof x.id==='string'&&x.id.length>0);
 card.hidden=!draft;
 if(!draft)return;
 card.dataset.draftId=draft.id;
 setText('sjn-db-resume-title',String(draft.title||'Saved Practice Test'));
 setText('sjn-db-resume-info',fmt(draft.answered||0)+' of '+fmt(draft.total||0)+' answered');
 const err=$('sjn-db-resume-error');if(err){err.hidden=true;err.textContent=''}
}
async function enter(force=false){
 const uid=bridge()?.userId?.();
 if(!uid){reset();return false}
 if(uid!==owner){reset();owner=uid}
 savedCard();
 if(!force&&!needsRefresh&&payload&&Date.now()-cachedAt<90000){
  renderTotals(payload);renderQuote(payload,uid);return true;
 }
 if(request?.owner===uid)return request.promise;
 const ticket=++serial;
 const promise=(async()=>{
  try{
   const response=await bridge().load('/student-analytics?offset=0');
   if(ticket!==serial||uid!==bridge()?.userId?.())return false;
   const summary=response?.summary;
   if(response?.userId!==uid||!summary||!summary.totals||!Array.isArray(summary.nodes)||
      !Number.isSafeInteger(summary.totals.answered))throw Error('Incomplete verified dashboard stats');
   owner=uid;payload=summary;cachedAt=Date.now();needsRefresh=false;
   renderTotals(summary);renderQuote(summary,uid);
   if($('sjn-db-error'))$('sjn-db-error').hidden=true;
   return true;
  }catch(e){
   if(ticket!==serial||uid!==bridge()?.userId?.())return false;
   needsRefresh=true;payload=null;showUnavailable();return false;
  }finally{if(request?.promise===promise)request=null}
 })();
 request={owner:uid,promise};return promise;
}
function reset(){
 ++serial;owner=null;payload=null;cachedAt=0;needsRefresh=true;
 request=null;historyOwner=null;saved=[];
 if($('sjn-db-resume'))$('sjn-db-resume').hidden=true;
}
function updateHistory(uid,rows){
 if(uid!==bridge()?.userId?.())return;
 historyOwner=uid;saved=Array.isArray(rows)?rows:[];savedCard();
}
function invalidate(){
 ++serial;needsRefresh=true;cachedAt=0;request=null;
}
function sync(){
 if(owner&&owner===bridge()?.userId?.()&&payload)renderTotals(payload);
}
async function resumeSaved(){
 const card=$('sjn-db-resume'),id=card?.dataset.draftId,uid=bridge()?.userId?.();
 if(!id||!uid||uid!==historyOwner)return;
 const button=$('sjn-db-resume-button'),error=$('sjn-db-resume-error');
 if(button){button.disabled=true;button.textContent='Opening saved test…'}
 if(error){error.hidden=true;error.textContent=''}
 try{await bridge().resume(id);
  if(uid!==bridge()?.userId?.())return;
  card.hidden=true;
 }catch(e){
  if(uid!==bridge()?.userId?.())return;
  if(error){error.textContent=e?.message||'Could not reopen the saved test.';error.hidden=false}
 }finally{if(button){button.disabled=false;button.textContent='Resume Test'}}
}
$('sjn-db-retry')?.addEventListener('click',()=>{void enter(true)});
$('sjn-db-resume-button')?.addEventListener('click',()=>resumeSaved());
for(const [id,module] of [['sjn-db-create-test','wizard'],['sjn-db-courses','courses'],['sjn-db-papers','pastpapers']]){
 $(id)?.addEventListener('click',()=>{bridge()?.openModule?.(module)});
}
window.SJNDashboard={enter,reset,invalidate,sync,updateHistory};
})();
