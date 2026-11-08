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
// Owner-approved life/study/preparation quotations (source-linked, no medical-career assumptions).
// Source passages/speeches were curated for encouragement without outcome absolutism.
// Copy is intentionally short; links point to the original work or an institutional transcript.
const quotes=[
 {text:"While we are postponing, life speeds by.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_1",band:"all"},
 {text:"Lay hold of to-day’s task, and you will not need to depend so much upon to-morrow’s.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_1",band:"steady"},
 {text:"Each day acquire something that will fortify you against poverty, against death, indeed against other misfortunes as well.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_2",band:"steady"},
 {text:"No good thing is pleasant to possess, without friends to share it.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_6",band:"all"},
 {text:"We can assist each other greatly.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_6",band:"support"},
 {text:"So look forward to better things.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_13",band:"support"},
 {text:"How often has the unexpected happened! How often has the expected never come to pass!",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_13",band:"support"},
 {text:"You must persevere, must develop new strength by continuous study.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_16",band:"steady"},
 {text:"Hold fast to it and establish it firmly.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_16",band:"steady"},
 {text:"Look toward the true good, and rejoice only in that which comes from your own store.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_23",band:"all"},
 {text:"Work is the sustenance of noble minds.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_31",band:"steady"},
 {text:"Make yourself happy through your own efforts.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_31",band:"support"},
 {text:"Look into their wisdom as a whole; study it as a whole.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_33",band:"steady"},
 {text:"The larger part of goodness is the will to become good.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_34",band:"all"},
 {text:"Proceed with steady step.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_37",band:"steady"},
 {text:"You will learn from her what you should undertake, and how it should be done.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_37",band:"steady"},
 {text:"There are obstacles in our path; so let us fight, and call to our assistance some helpers.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_52",band:"support"},
 {text:"Every pain sometimes stops, or at any rate slackens.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_78",band:"support"},
 {text:"The smallest circle of all is the day; but even a day has its beginning and its ending.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_12",band:"all"},
 {text:"You should share with a friend at least all your worries and reflections.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_3",band:"support"},
 {text:"Those who seem to be busied with nothing are busied with the greater tasks.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_8",band:"support"},
 {text:"It means something to call a halt.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_22",band:"support"},
 {text:"Show me that you are stout-hearted; lighten your baggage for the march.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_25",band:"support"},
 {text:"Simply and freely choose the better, and hold to it.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_III",band:"all"},
 {text:"Constantly then give to thyself this retreat, and renew thyself.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_IV",band:"support"},
 {text:"But it is necessary to take rest also.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_V",band:"support"},
 {text:"I am rising to the work of a human being.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_V",band:"steady"},
 {text:"Motions and changes are continually renewing the world.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_VI",band:"all"},
 {text:"The education and the teaching of youth aim at something.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_VI",band:"steady"},
 {text:"To recover thy life is in thy power.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_VII",band:"support"},
 {text:"The art of life is more like the wrestler's art than the dancer's.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_VII",band:"all"},
 {text:"Attend to the matter which is before thee.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_VIII",band:"steady"},
 {text:"Use plain discourse.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_VIII",band:"all"},
 {text:"Both man and God and the universe produce fruit; at the proper seasons each produces it.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_IX",band:"support"},
 {text:"All things are changing.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_IX",band:"support"},
 {text:"No longer talk at all about the kind of man that a good man ought to be, but be such.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_X",band:"steady"},
 {text:"It sees itself, analyzes itself, and makes itself such as it chooses.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_XI",band:"all"},
 {text:"If it is not right, do not do it: if it is not true, do not say it.",author:"Marcus Aurelius",source:"https://en.wikisource.org/wiki/The_Thoughts_of_the_Emperor_Marcus_Aurelius_Antoninus/Book_XII",band:"all"},
 {text:"Calmness of mind is one of the beautiful jewels of wisdom.",author:"James Allen",source:"https://en.wikisource.org/wiki/As_a_Man_Thinketh/Chapter_7",band:"support"},
 {text:"Self-control is strength; Right Thought is mastery; Calmness is power.",author:"James Allen",source:"https://en.wikisource.org/wiki/As_a_Man_Thinketh/Chapter_7",band:"support"},
 {text:"Intellectual achievements are the result of thought consecrated to the search for knowledge.",author:"James Allen",source:"https://en.wikisource.org/wiki/As_a_Man_Thinketh/Chapter_5",band:"steady"},
 {text:"Act is the blossom of thought.",author:"James Allen",source:"https://en.wikisource.org/wiki/As_a_Man_Thinketh/Chapter_1",band:"all"},
 {text:"It is my chief duty and joy to accomplish humble tasks as though they were great and noble.",author:"Helen Keller",source:"https://en.wikisource.org/wiki/Optimism_%28Keller%29",band:"support"},
 {text:"Knowledge is love and light and vision.",author:"Helen Keller",source:"https://en.wikisource.org/wiki/The_Story_of_My_Life_%28Keller%29/Part_1",band:"all"},
 {text:"Nothing in life is to be feared, it is only to be understood.",author:"Marie Curie",source:"https://www.nobelprize.org/uploads/2025/04/annual-review-2024.pdf",band:"support"},
 {text:"Sometimes life hits you in the head with a brick. Don’t lose faith.",author:"Steve Jobs",source:"https://news.stanford.edu/stories/2005/06/steve-jobs-2005-graduates-stay-hungry-stay-foolish?view=print",band:"support"},
 {text:"Failure taught me things about myself that I could have learned no other way.",author:"J. K. Rowling",source:"https://news.harvard.edu/gazette/story/2008/06/text-of-j-k-rowling-speech/",band:"support"},
 {text:"The first principle is that you must not fool yourself—and you are the easiest person to fool.",author:"Richard P. Feynman",source:"https://calteches.library.caltech.edu/51/2/CargoCult.htm",band:"steady"},
 {text:"As a progressive and evolving being, man is where he is that he may learn that he may grow.",author:"James Allen",source:"https://en.wikisource.org/wiki/As_a_Man_Thinketh/Chapter_2",band:"support"},
 {text:"We should welcome it with glad hearts.",author:"Seneca",source:"https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_12",band:"support"}
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
 // A low score invites reassurance, not a public judgement or fixed career goal.
 const band=answered<15||ratio<.6?'support':'steady';
 const pool=quotes.filter(q=>q.band==='all'||q.band===band);
 // Three daily, local-clock eight-hour slots. No timer, storage, or extra request.
 // Within a band, every consecutive slot advances to a different quotation.
 const now=new Date(),dateOrdinal=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000);
 const slot=dateOrdinal*3+Math.floor(now.getHours()/8);
 let hash=2166136261;
 for(const char of String(uid)+'|'+band){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
 return pool[((hash>>>0)+slot)%pool.length];
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
