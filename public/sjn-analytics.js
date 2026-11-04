/* SJN MedNest Analytics — read-only, account-isolated, date-scoped insights. */
(()=>{
'use strict';
const root=document.getElementById('module-analytics');
if(!root)return;
const $=sel=>root.querySelector(sel);
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const icon=name=>'<i class="fa-solid fa-'+name+'" aria-hidden="true"></i>';
const subjectTone=name=>{
 const value=String(name||'').toLowerCase();
 return value.includes('biolog')?'bio':value.includes('chem')?'chem':
 value.includes('phys')?'phys':value.includes('english')?'eng':
 value.includes('logical')?'lr':'mixed';
};
const regionTone=name=>{
 const value=String(name||'').trim().toLowerCase();
 return ['sindh','punjab','kpk','balochistan','federal','nums'].includes(value)?value:
 value==='kp'?'kpk':'mixed';
};
const subjectBadge=name=>'<span class="sjn-a-subject-badge" data-subject="'+subjectTone(name)+'">'+
 html(name)+'</span>';
const sources=[
 {id:'sjn',name:'SJN Question Bank',sub:'Academy practice questions',symbol:'book-open',tone:'blue'},
 {id:'pastbank',name:'Past Papers Question Bank',sub:'Chapter and topic-based past questions',symbol:'layer-group',tone:'teal'},
 {id:'courses',name:'My Courses',sub:'Course and test performance',symbol:'graduation-cap',tone:'purple'},
 {id:'papers',name:'Full-Length Past Papers',sub:'Examination performance',symbol:'file-lines',tone:'amber'}
];
const periods={all:'All Time',day:'Last 24 Hours',week:'Last 7 Days',fifteen:'Last 15 Days',month:'Last 30 Days',quarter:'Last 90 Days',previous:'Previous Month',custom:'Custom Range'};
const zero=()=>({questions:0,answered:0,correct:0,incorrect:0,skipped:0,unique_questions:0});
const number=n=>Number.isFinite(Number(n))?Number(n):0;
const fmt=n=>number(n).toLocaleString();
const pct=(n,d)=>number(d)>0?(100*number(n)/number(d)).toFixed(1).replace(/\.0$/,'')+'%':'—';
const sum=(rows)=>rows.reduce((a,r)=>{for(const k of Object.keys(a))a[k]+=number(r[k]);return a},zero());
const answered=r=>number(r?.answered);
const accuracy=r=>pct(r?.correct,r?.answered);
const sample=r=>answered(r)>=15;
const strength=r=>!answered(r)?'Not started':!sample(r)?'More practice needed':number(r.correct)/number(r.answered)>=.8?'Strong':number(r.correct)/number(r.answered)>=.6?'Developing':'Needs attention';
const tone=r=>!sample(r)?'neutral':number(r.correct)/number(r.answered)>=.8?'good':number(r.correct)/number(r.answered)>=.6?'mid':'bad';
const dateISO=d=>d.toISOString();
const calendarDate=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const dateLabel=v=>{const dt=new Date(v);return Number.isFinite(dt.getTime())?dt.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Unknown date'};
const user=()=>window.SJNAnalyticsBridge?.userId?.()||null;
const state={owner:null,period:'all',from:'',to:'',view:'overview',bank:'',subject:'',chapter:'',course:'',paper:'',sort:'weak',status:'idle',data:null,cache:new Map(),pending:null,generation:0};
function periodRange(){
 // Stable minute-aligned periods avoid redundant requests on ordinary tab visits.
 const now=new Date(Math.floor(Date.now()/60000)*60000),end=new Date(now);
 let start=null,prevStart=null,prevEnd=null;
 const days={day:1,week:7,fifteen:15,month:30,quarter:90}[state.period];
 if(days){start=new Date(end.getTime()-days*86400000);prevEnd=start;prevStart=new Date(start.getTime()-days*86400000)}
 else if(state.period==='previous'){
  start=new Date(now.getFullYear(),now.getMonth()-1,1);
  const last=new Date(now.getFullYear(),now.getMonth(),1);
  end.setTime(last.getTime());
  prevEnd=new Date(start);prevStart=new Date(start.getFullYear(),start.getMonth()-1,1);
 } else if(state.period==='custom'){
  if(!state.from||!state.to||state.from>state.to)return null;
  start=new Date(state.from+'T00:00:00');end.setTime(new Date(state.to+'T00:00:00').getTime()+86400000);
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))return null;
  if(end.getTime()-start.getTime()>10*366*86400000)return null;
  const span=end.getTime()-start.getTime();prevEnd=new Date(start);prevStart=new Date(start.getTime()-span);
 }
 return {from:start?dateISO(start):'',to:start?dateISO(end):'',
  previousFrom:prevStart?dateISO(prevStart):'',previousTo:prevEnd?dateISO(prevEnd):'',
  offset:-now.getTimezoneOffset()};
}
const keyOf=r=>JSON.stringify([r.from,r.to,r.previousFrom,r.previousTo,r.offset]);
function invalidate(){
 state.cache.clear();state.data=null;state.status='idle';state.generation++;
 state.pending=null;
}
function reset(){state.owner=null;state.view='overview';state.bank='';state.subject='';state.chapter='';state.course='';state.paper='';invalidate();root.replaceChildren();}
function loading(){
 root.innerHTML='<div class="sjn-a-loading"><span class="sjn-a-spin"></span><div><strong>Preparing your performance insights</strong><p>Reading verified results from your completed tests…</p></div></div>';
}
async function load(force=false){
 const uid=user();if(!uid){reset();return}
 if(state.owner!==uid){reset();state.owner=uid}
 const period=periodRange();
 if(!period){state.status='invalid';render();return}
 const k=keyOf(period);
 const cached=state.cache.get(k);
 if(!force&&cached&&Date.now()-cached.at<90000){state.data=cached.data;state.status='ready';render();return}
 if(state.pending&&state.pending.key===k)return state.pending.promise;
 const ticket=++state.generation;state.status='loading';state.data=null;loading();
 const query=new URLSearchParams({offset:String(period.offset)});
 if(period.from){query.set('from',period.from);query.set('to',period.to)}
 if(period.previousFrom){query.set('previousFrom',period.previousFrom);query.set('previousTo',period.previousTo)}
 const promise=(async()=>{
  try{
   const payload=await window.SJNAnalyticsBridge.load('/student-analytics?'+query.toString());
   if(ticket!==state.generation||uid!==user())return;
   const data=payload?.summary;
   if(payload?.userId!==uid||!data||!data.totals||!Array.isArray(data.nodes)||
    !Array.isArray(data.bankCatalog)||!Array.isArray(data.lifetimeCoverage)||
    !Array.isArray(data.daily)||!Array.isArray(data.tests))throw Error('Incomplete student Analytics data');
   state.data=data;state.cache.set(k,{data,at:Date.now()});
   if(state.cache.size>5)state.cache.delete(state.cache.keys().next().value);
   state.status='ready';render();
  }catch(err){if(ticket!==state.generation||uid!==user())return;
   state.status='error';state.data=null;render();
  }finally{if(state.pending?.key===k)state.pending=null}
 })();
 state.pending={key:k,promise};return promise;
}
function heading(){
 return '<div class="sjn-a-head"><div class="sjn-a-heading-copy"><div class="sjn-a-eyebrow">'+icon('chart-line')+'<span>PERFORMANCE CENTER</span></div>'+
 '<h2>My Analytics</h2><p>Understand your progress. Focus on what matters.</p></div></div>';
}
function periodControls(){
 return '<div class="sjn-a-filter"><div class="sjn-a-filter-label">'+icon('calendar-days')+' <span>Time Period</span></div>'+
 '<select data-a-period aria-label="Analytics time period">'+Object.entries(periods).map(([key,label])=>
 '<option value="'+key+'"'+(key===state.period?' selected':'')+'>'+label+'</option>').join('')+'</select>'+
 (state.period==='custom'?'<div class="sjn-a-custom"><label>From<input type="date" data-a-from value="'+html(state.from)+'"></label>'+
 '<label>To<input type="date" data-a-to value="'+html(state.to)+'"></label><button data-a-apply>Apply</button></div>':'')+'</div>';
}
const tabs=[['overview','Overview','chart-pie'],['banks','Question Banks','book-open'],['courses','Courses','graduation-cap'],['papers','Past Papers','file-lines']];
function nav(){
 return '<div class="sjn-a-topbar">'+
 '<nav class="sjn-a-tabs" aria-label="Analytics sections">'+tabs.map(([id,label,ico])=>
 '<button type="button" data-a-tab="'+id+'" aria-current="'+(state.view===id?'page':'false')+'" class="'+(state.view===id?'active':'')+'">'+icon(ico)+'<span>'+label+'</span></button>').join('')+'</nav>'+
 periodControls()+'</div>';
}
function metric(title,value,description,ico,color){
 return '<div class="sjn-a-metric" data-tone="'+color+'"><span class="sjn-a-metric-icon">'+icon(ico)+'</span>'+
 '<span class="sjn-a-metric-label">'+html(title)+'</span><strong>'+html(value)+'</strong><small>'+html(description)+'</small></div>';
}
function panel(title,sub,body,cls=''){
 return '<section class="sjn-a-panel '+cls+'"><div class="sjn-a-panel-head"><div><h3>'+html(title)+'</h3>'+
 (sub?'<p>'+html(sub)+'</p>':'')+'</div></div>'+body+'</section>';
}
function countPills(r,compact=false){
 return '<div class="sjn-a-counts'+(compact?' is-compact':'')+'">'+
 [['correct','Correct','good'],['incorrect','Incorrect','bad'],['skipped','Skipped','mid']].map(([k,label,t])=>
 '<div data-tone="'+t+'"><strong>'+fmt(r[k])+'</strong><span>'+label+'</span></div>').join('')+'</div>';
}
function evidenceLine(r){
 return '<span class="sjn-a-evidence"><b>'+fmt(r.answered)+'</b> answered <em>·</em> <b>'+fmt(r.skipped)+'</b> skipped</span>';
}
function labelStats(r){
 return '<span class="sjn-a-mini-stat" data-tone="good">'+fmt(r.correct)+' correct</span>'+
 '<span class="sjn-a-mini-stat" data-tone="bad">'+fmt(r.incorrect)+' incorrect</span>'+
 '<span class="sjn-a-mini-stat" data-tone="mid">'+fmt(r.skipped)+' skipped</span>';
}
function summary(r){return '<div class="sjn-a-sumline"><span>Answer accuracy <strong>'+accuracy(r)+'</strong></span>'+
 '<span>Answered <strong>'+fmt(r.answered)+'</strong></span><span>Skipped <strong>'+fmt(r.skipped)+'</strong></span></div>'}
function rank(rows){const xs=[...rows];const ratio=x=>answered(x)?number(x.correct)/number(x.answered):null;
 xs.sort((a,b)=>{switch(state.sort){
 case 'strong':return (ratio(b)??-1)-(ratio(a)??-1)||answered(b)-answered(a);
 case 'most':return answered(b)-answered(a);
 case 'least':return answered(a)-answered(b);
 case 'az':return String(a.name).localeCompare(String(b.name));
 default:return (sample(a)?0:1)-(sample(b)?0:1)|| (ratio(a)??2)-(ratio(b)??2)||answered(b)-answered(a);
 }});return xs;
}
function sortControl(){return '<label class="sjn-a-sort">Sort <select data-a-sort>'+
 [['weak','Needs attention first'],['strong','Strongest first'],['most','Most practiced'],['least','Least practiced'],['az','A to Z']].map(([k,v])=>
 '<option value="'+k+'"'+(state.sort===k?' selected':'')+'>'+v+'</option>').join('')+'</select></label>';}
function bar(n,d,t='blue'){return '<div class="sjn-a-track"><span style="width:'+Math.min(100,d>0?100*n/d:0)+'%" data-tone="'+t+'"></span></div>'}
function statusTag(r){return '<span class="sjn-a-status" data-tone="'+tone(r)+'">'+html(strength(r))+'</span>'}
function snapshot(rows){const s=sum(rows);return '<div class="sjn-a-snapshot"><strong>'+accuracy(s)+'</strong>'+statusTag(s)+
 '<small>'+fmt(s.correct)+' correct of '+fmt(s.answered)+' answered · '+fmt(s.skipped)+' skipped</small></div>'}
function rowsBy(data,fn){
 const map=new Map();
 for(const x of data){const name=fn(x);if(!name)continue;
 if(!map.has(name))map.set(name,[]);map.get(name).push(x);
 }
 return [...map].map(([name,rows])=>({name,...sum(rows),rows}));
}
function trend(data){
 const rows=(data.daily||[]).map(x=>({day:x.day,value:answered(x)?100*number(x.correct)/number(x.answered):null,count:number(x.answered)}));
 if(!rows.length)return '<div class="sjn-a-empty">'+icon('chart-line')+'<p>No answered questions in this period yet.</p></div>';
 const width=700,height=190,left=28,right=12,top=16,bottom=27;
 const coords=rows.map((r,i)=>({x:left+(rows.length===1?.5:i/(rows.length-1))*(width-left-right),
 y:top+(100-(r.value??0))/100*(height-top-bottom),...r})).filter(x=>x.value!==null);
 let line=coords.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
 const step=Math.max(1,Math.ceil(rows.length/7));
 const ticks=[0,25,50,75,100].map(v=>'<line x1="'+left+'" x2="'+(width-right)+'" y1="'+(top+(100-v)/100*(height-top-bottom))+'" y2="'+(top+(100-v)/100*(height-top-bottom))+'" stroke="#2e3240" stroke-width="1"/><text x="2" y="'+(top+(100-v)/100*(height-top-bottom)+4)+'" fill="#8993a7" font-size="11">'+v+'</text>').join('');
 const xlabels=rows.filter((_,i)=>i%step===0||i===rows.length-1).map((r,i,arr)=>'<text x="'+(left+(rows.length===1?.5:rows.findIndex(x=>x===r)/(rows.length-1))*(width-left-right)).toFixed(1)+'" y="'+(height-5)+'" text-anchor="middle" font-size="11" fill="#9197aa">'+html(r.day.slice(5))+'</text>').join('');
 return '<div class="sjn-a-trend"><svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Answer accuracy over time">'+ticks+
 (line?'<path d="'+line+'" fill="none" stroke="#63b3fa" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>':'')+
 coords.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="#72dcbb"><title>'+html(p.day)+': '+Math.round(p.value)+'% · '+fmt(p.count)+' answered</title></circle>').join('')+xlabels+
 '</svg></div><div class="sjn-a-legend">Daily accuracy for days with answered questions. Hover or tap chart points for counts.</div>';
}
function sourceCard(info,rows,buttonLabel,action){
 const s=sum(rows),catalog=state.data.bankCatalog||[],covers=state.data.lifetimeCoverage||[];
 const bank=info.id==='sjn'?'SJN Question Bank':info.id==='pastbank'?'Past Papers Question Bank':null;
 const total=bank?catalog.filter(c=>c.bank===bank).reduce((a,x)=>a+number(x.available),0):null;
 const used=bank?covers.filter(c=>c.bank===bank).reduce((a,x)=>a+number(x.covered),0):null;
 return '<button class="sjn-a-source" data-tone="'+info.tone+'" data-a-tab="'+action+'" type="button"><div class="sjn-a-source-top">'+
 '<span class="sjn-a-source-icon">'+icon(info.symbol)+'</span><span>'+icon('arrow-up-right-from-square')+'</span></div>'+
 '<strong>'+html(info.name)+'</strong><small>'+html(info.sub)+'</small><div class="sjn-a-source-stat">'+
 '<span>Accuracy <b>'+accuracy(s)+'</b></span><span>'+fmt(s.answered)+' answered</span></div>'+
 (bank?bar(used,total,info.tone)+'<small>'+fmt(used)+' of '+fmt(total)+' questions covered (lifetime)</small>':'')+
 '<span class="sjn-a-source-link">'+html(buttonLabel)+' '+icon('arrow-right')+'</span></button>';
}
function focus(data){
 const by=rowsBy(data.nodes.filter(n=>n.source_type==='sjn'||n.source_type==='pastbank'),n=>
 n.bank+'|||'+n.subject+'|||'+n.chapter);
 const candidates=by.filter(x=>sample(x)).sort((a,b)=>number(a.correct)/number(a.answered)-number(b.correct)/number(b.answered)).slice(0,4);
 if(!candidates.length)return '<div class="sjn-a-empty compact">Focus recommendations appear after at least 15 answered questions in a chapter.</div>';
 return '<div class="sjn-a-focus-list">'+candidates.map(x=>{const [bank,subject,chapter]=x.name.split('|||');
 return '<div class="sjn-a-focus"><div><strong>'+html(chapter||subject)+'</strong><small>'+html(subject)+' · '+html(bank)+'</small></div>'+
 '<div class="sjn-a-focus-score"><strong>'+accuracy(x)+'</strong><small>'+fmt(x.answered)+' answered</small></div></div>';}).join('')+'</div>';
}
function overview(data){
 const t=data.totals;const prev=data.previous;
 let compared='';
 if(prev&&answered(prev)&&answered(t)){
  const change=100*(number(t.correct)/number(t.answered)-number(prev.correct)/number(prev.answered));
  compared='<span class="sjn-a-compare" data-tone="'+(change>=0?'good':'bad')+'">'+
 (change>0?'+':'')+change.toFixed(1)+' pp vs previous equivalent period</span>';
 }
 const metrics='<div class="sjn-a-metrics">'+metric('Answer Accuracy',accuracy(t),fmt(t.correct)+' of '+fmt(t.answered)+' answered','bullseye','teal')+
 metric('Questions Answered',fmt(t.answered),'From submitted tests','list-check','blue')+
 metric('Tests Completed',fmt(t.tests),'Verified question-level records','clipboard-check','purple')+
 metric('Skipped Questions',fmt(t.skipped),'Not counted as answered','forward','amber')+'</div>';
 const cards='<div class="sjn-a-source-grid">'+sources.map(info=>sourceCard(info,data.nodes.filter(n=>n.source_type===info.id),'Explore Analytics',info.id==='sjn'||info.id==='pastbank'?'banks':info.id)).join('')+'</div>';
 return metrics+'<div class="sjn-a-two">'+panel('Accuracy Over Time','Your answered-question accuracy during the selected period',compared+trend(data))+
 panel('Your Focus Areas','Practice priorities based on sufficient answered questions',focus(data))+'</div>'+
 panel('Explore Your Performance','Select a source to see detailed insights',cards);
}
function breadcrumb(labels){return '<div class="sjn-a-crumb">'+labels.map((x,i)=>i===0?'<span>'+html(x)+'</span>':icon('chevron-right')+'<span>'+html(x)+'</span>').join('')+'</div>'}
function detailRows(rows,kind){
 const ordered=rank(rows);
 if(!ordered.length)return '<div class="sjn-a-empty compact">No records are available at this level for the selected period.</div>';
 return '<div class="sjn-a-detail-list">'+ordered.map(x=>'<button type="button" class="sjn-a-detail-row" data-a-'+kind+'="'+html(x.name)+'">'+
 '<span class="sjn-a-detail-name"><strong>'+html(x.name||'Not classified')+'</strong><small>'+fmt(x.answered)+' answered · '+fmt(x.skipped)+' skipped</small></span>'+
 '<span class="sjn-a-detail-score" data-tone="'+tone(x)+'">'+accuracy(x)+'</span>'+icon('chevron-right')+'</button>').join('')+'</div>';
}
function bankView(data){
 const allBanks=['SJN Question Bank','Past Papers Question Bank'];
 if(!state.bank){return panel('Question Bank Analytics','Choose a question bank to inspect subject, chapter and topic performance',
 '<div class="sjn-a-bank-grid">'+allBanks.map(bank=>{
  const info=sources[bank==='SJN Question Bank'?0:1];
  const rows=data.nodes.filter(r=>r.bank===bank),s=sum(rows);
  const catalog=data.bankCatalog.filter(r=>r.bank===bank).reduce((a,x)=>a+number(x.available),0);
  const used=data.lifetimeCoverage.filter(r=>r.bank===bank).reduce((a,x)=>a+number(x.covered),0);
  return '<button type="button" class="sjn-a-bank-card" data-a-bank="'+html(bank)+'" data-tone="'+info.tone+'">'+
  '<div class="sjn-a-bank-icon">'+icon(info.symbol)+'</div><strong>'+html(bank)+'</strong>'+
  '<small>'+fmt(s.answered)+' answers · '+accuracy(s)+' accuracy</small>'+
  '<div class="sjn-a-bank-coverage"><span>Lifetime Coverage</span><b>'+pct(used,catalog)+'</b></div>'+
  bar(used,catalog,info.tone)+'<small>'+fmt(used)+' / '+fmt(catalog)+' unique questions</small>'+
  '<span class="sjn-a-source-link">Explore Subjects '+icon('arrow-right')+'</span></button>';
 }).join('')+'</div>');}
 const rows=data.nodes.filter(r=>r.bank===state.bank);
 const catalog=data.bankCatalog.filter(r=>r.bank===state.bank);
 const lifetime=data.lifetimeCoverage.filter(r=>r.bank===state.bank);
 const match=r=>(!state.subject||r.subject===state.subject)&&(!state.chapter||r.chapter===state.chapter);
 const picked=rows.filter(match),tot=sum(picked);
 const names=[state.bank,state.subject,state.chapter].filter(Boolean);
 const level=state.chapter?'Topic':state.subject?'Chapter':'Subject';
 const key=state.chapter?'topic':state.subject?'chapter':'subject';
 const parents=state.chapter?['subject','chapter']:state.subject?['subject']:[];
 const by=rowsBy(picked,r=>r[key]||'Not classified');
 const avail=rowsBy(catalog.filter(match),r=>r[key]||'Not classified');
 const covered=rowsBy(lifetime.filter(match),r=>r[key]||'Not classified');
 const combined=new Map();
 for(const item of [...by,...avail,...covered])if(!combined.has(item.name))combined.set(item.name,{name:item.name,...zero(),available:0,covered:0});
 for(const x of by)Object.assign(combined.get(x.name),Object.fromEntries(Object.keys(zero()).map(k=>[k,number(x[k])])));
 for(const x of avail)combined.get(x.name).available=x.rows.reduce((a,x)=>a+number(x.available),0);
 for(const x of covered)combined.get(x.name).covered=x.rows.reduce((a,x)=>a+number(x.covered),0);
 const header='<div class="sjn-a-backline"><button data-a-back="'+(state.chapter?'chapter':state.subject?'subject':'bank')+'">'+icon('arrow-left')+' Back</button>'+
 breadcrumb(names)+'</div>';
 const stats='<div class="sjn-a-inline-stat">'+metric('Answer Accuracy',accuracy(tot),fmt(tot.answered)+' answered','bullseye','teal')+
 metric('Unique Coverage',fmt(lifetime.filter(match).reduce((a,r)=>a+number(r.covered),0)),fmt(catalog.filter(match).reduce((a,r)=>a+number(r.available),0))+' available','layer-group','blue')+'</div>';
 const detail=rank([...combined.values()]);
 return header+panel(state.chapter||state.subject||state.bank,'Your selected period · '+level+'-wise insights',stats+
 '<div class="sjn-a-panel-tools"><strong>'+level+' Breakdown</strong>'+sortControl()+'</div>'+
 (detail.length?'<div class="sjn-a-detail-list">'+detail.map(x=>'<button type="button" class="sjn-a-detail-row"'+(level!=='Topic'?' data-a-'+key+'="'+html(x.name)+'"':'')+'>'+
 '<span class="sjn-a-detail-name"><strong>'+html(x.name)+'</strong><small>'+fmt(x.answered)+' answered · '+fmt(x.skipped)+' skipped · '+fmt(x.covered)+' / '+fmt(x.available)+' covered</small></span>'+
 '<span class="sjn-a-detail-score" data-tone="'+tone(x)+'">'+accuracy(x)+'</span>'+
 (level==='Topic'?'':icon('chevron-right'))+'</button>').join('')+'</div>':
 '<div class="sjn-a-empty compact">No questions in this section yet.</div>')+
 '<p class="sjn-a-help">Accuracy uses answered questions from the selected period. Coverage reflects lifetime unique questions and is not affected by the date filter.</p>');
}
function courseView(data){
 const courses=[...new Set(data.courseCatalog.map(x=>x.session))];
 if(!state.course){
 return panel('Course Analytics','Select a course to view individual test performance',
 '<div class="sjn-a-bank-grid">'+courses.map(code=>{const tests=data.courseCatalog.filter(x=>x.session===code);
 const ids=new Set(tests.map(x=>String(x.id)));const rows=data.tests.filter(x=>x.source_type==='courses'&&ids.has(String(x.group_key)));
 const s=sum(rows);
 return '<button class="sjn-a-bank-card" data-a-course="'+html(code)+'" type="button" data-tone="purple"><div class="sjn-a-bank-icon">'+icon('graduation-cap')+'</div>'+
 '<strong>'+html(code==='genome'?'Genome Test Session':code)+'</strong><small>'+tests.length+' published tests · '+rows.length+' recorded attempts</small>'+
 '<div class="sjn-a-bank-coverage"><span>Answer accuracy</span><b>'+accuracy(s)+'</b></div>'+
 '<span class="sjn-a-source-link">Explore Course '+icon('arrow-right')+'</span></button>';}).join('')+
 (!courses.length?'<div class="sjn-a-empty">No course tests have been published yet.</div>':'')+'</div>');}
 const tests=data.courseCatalog.filter(x=>x.session===state.course),ids=new Set(tests.map(x=>String(x.id)));
 const rows=data.tests.filter(x=>x.source_type==='courses'&&ids.has(String(x.group_key)));
 const all=data.nodes.filter(x=>x.source_type==='courses'&&ids.has(String(x.group_key)));
 return '<div class="sjn-a-backline"><button data-a-back="course">'+icon('arrow-left')+' All Courses</button></div>'+
 panel(state.course==='genome'?'Genome Test Session':state.course,'Course-wide performance for your selected period',
 '<div class="sjn-a-inline-stat">'+metric('Answer Accuracy',accuracy(sum(all)),fmt(sum(all).answered)+' answered','bullseye','teal')+
 metric('Test Attempts',fmt(rows.length),tests.length+' published tests','clipboard-check','purple')+'</div>'+
 '<div class="sjn-a-panel-tools"><strong>Individual Tests</strong></div><div class="sjn-a-detail-list">'+tests.map(t=>{
 const r=sum(all.filter(x=>String(x.group_key)===String(t.id))),matches=rows.filter(x=>String(x.group_key)===String(t.id));
 return '<div class="sjn-a-course-test"><div><strong>'+html(t.title)+'</strong><small>Test '+t.testNumber+' · '+fmt(matches.length)+' completed attempt(s)</small></div>'+
 '<div class="sjn-a-test-numbers">'+statusTag(r)+'<strong>'+accuracy(r)+'</strong><small>'+fmt(r.answered)+' answered</small></div>'+
 (matches.length?'<div class="sjn-a-course-subjects">'+rowsBy(all.filter(x=>String(x.group_key)===String(t.id)),x=>x.subject).map(x=>
 '<span>'+html(x.name)+': <b>'+accuracy(x)+'</b> ('+fmt(x.answered)+')</span>').join('')+
 rowsBy(all.filter(x=>String(x.group_key)===String(t.id)&&x.chapter),x=>x.chapter).map(x=>
 '<span>Chapter · '+html(x.name)+': <b>'+accuracy(x)+'</b> ('+fmt(x.answered)+')</span>').join('')+
 '</div>':'')+'</div>';}).join('')+'</div>'+
 '<p class="sjn-a-help">Course question topics are not shown. Chapter breakdowns are displayed only when relevant metadata exists. Test History retakes may be included in historical attempt totals but do not replace the Course page\'s latest official result.</p>');
}
function paperView(data){
 const papers=data.paperCatalog||[];
 if(!state.paper)return panel('Full-Length Past Papers','Review your completed examinations by paper, subject, chapter and topic',
 '<div class="sjn-a-bank-grid">'+papers.map(p=>{const rows=data.tests.filter(x=>x.source_type==='papers'&&x.title===p.title);
 const total=rows.reduce((a,x)=>a+number(x.answered),0),correct=rows.reduce((a,x)=>a+number(x.correct),0);
 return '<button type="button" class="sjn-a-bank-card" data-tone="amber" data-a-paper="'+html(String(p.id))+'">'+
 '<div class="sjn-a-bank-icon">'+icon('file-lines')+'</div><strong>'+html(p.title)+'</strong><small>'+html(p.region||'MDCAT')+' · '+html(p.year||'')+'</small>'+
 '<div class="sjn-a-bank-coverage"><span>Accuracy</span><b>'+pct(correct,total)+'</b></div>'+
 '<small>'+rows.length+' recorded attempt(s)</small><span class="sjn-a-source-link">View Paper Analytics '+icon('arrow-right')+'</span></button>';}).join('')+
 (!papers.length?'<div class="sjn-a-empty">No full-length papers have been published yet.</div>':'')+'</div>');
 const p=papers.find(x=>String(x.id)===String(state.paper));if(!p){state.paper='';return paperView(data)}
 const all=data.nodes.filter(x=>x.source_type==='papers'&&x.group_key===p.title);
 const by=rowsBy(all,r=>r.subject);
 return '<div class="sjn-a-backline"><button data-a-back="paper">'+icon('arrow-left')+' All Papers</button></div>'+
 panel(p.title,'Full-Length Past Paper · '+html(p.region||'MDCAT'),
 '<div class="sjn-a-inline-stat">'+metric('Answer Accuracy',accuracy(sum(all)),fmt(sum(all).answered)+' answered','bullseye','teal')+
 metric('Submitted Answers',fmt(sum(all).questions),p.size+' questions per paper','list-check','amber')+'</div>'+
 '<div class="sjn-a-panel-tools"><strong>Subject Breakdown</strong>'+sortControl()+'</div>'+
 (by.length?'<div class="sjn-a-paper-groups">'+rank(by).map(x=>{
 const chapterRows=rowsBy(x.rows,r=>r.chapter||'Not classified');
 return '<details class="sjn-a-paper-subject"><summary><strong>'+html(x.name)+'</strong><span>'+accuracy(x)+' · '+fmt(x.answered)+' answered</span>'+icon('chevron-down')+'</summary>'+
 '<div class="sjn-a-paper-chapters">'+rank(chapterRows).map(c=>{
 const topics=rowsBy(c.rows,r=>r.topic||'Not classified');
 return '<details><summary>'+html(c.name)+' <span>'+accuracy(c)+'</span></summary>'+
 '<div class="sjn-a-topic-list">'+rank(topics).map(t=>'<div>'+html(t.name)+'<strong>'+accuracy(t)+'</strong><small>'+fmt(t.answered)+' answered</small></div>').join('')+'</div></details>';
 }).join('')+'</div></details>';}).join('')+'</div>':'<div class="sjn-a-empty compact">No completed attempts for this paper in this period.</div>'));
}
function render(){
 if(state.status==='idle'||state.status==='loading'&&!state.data){loading();return}
 root.innerHTML=heading()+nav()+
 (state.status==='invalid'?'<div class="sjn-a-error">Select a valid date range, up to 10 years, then choose Apply.</div>':
  state.status==='error'?'<div class="sjn-a-error">Analytics could not be verified. <button data-a-retry>Retry</button></div>':
  state.data?'<div class="sjn-a-content">'+
   (state.view==='banks'?bankView(state.data):state.view==='courses'?courseView(state.data):
    state.view==='papers'?paperView(state.data):overview(state.data))+
   '<footer class="sjn-a-foot">Based on your own verified completed attempts. Older score-only attempts are excluded from question-level insights.'+
   (number(state.data.legacyAttempts)?' '+fmt(state.data.legacyAttempts)+' older summary-only record(s) are not included.':'')+'</footer></div>':'');
}
root.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn||!root.contains(btn))return;
 if(btn.hasAttribute('data-a-retry')){void load(true);return}
 const tab=btn.dataset.aTab;if(tab){state.view=tab;state.bank='';state.subject='';state.chapter='';state.course='';state.paper='';render();return}
 if(btn.dataset.aBank){state.bank=btn.dataset.aBank;state.subject='';state.chapter='';render();return}
 if(btn.dataset.aSubject){state.subject=btn.dataset.aSubject;state.chapter='';render();return}
 if(btn.dataset.aChapter){state.chapter=btn.dataset.aChapter;render();return}
 if(btn.dataset.aCourse){state.course=btn.dataset.aCourse;render();return}
 if(btn.dataset.aPaper){state.paper=btn.dataset.aPaper;render();return}
 const back=btn.dataset.aBack;
 if(back){if(back==='chapter')state.chapter='';else if(back==='subject')state.subject='';
 else if(back==='bank')state.bank='';else if(back==='course')state.course='';else if(back==='paper')state.paper='';render();return}
 if(btn.hasAttribute('data-a-apply')){const a=$('[data-a-from]'),b=$('[data-a-to]');
 state.from=a?.value||'';state.to=b?.value||'';void load();return}
});
root.addEventListener('change',e=>{
 if(e.target.matches('[data-a-period]')){state.period=e.target.value;
 if(state.period==='custom'&&!state.from){const now=new Date();state.to=calendarDate(now);state.from=calendarDate(new Date(now.getTime()-30*86400000))}
 if(state.period==='custom'){render();return}void load();return}
 if(e.target.matches('[data-a-sort]')){state.sort=e.target.value;render()}
});
window.SJNAnalytics={enter:()=>load(),reset,invalidate,refresh:()=>load(true)};
})();
