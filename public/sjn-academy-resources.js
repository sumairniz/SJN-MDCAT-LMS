(()=>{
'use strict';
const root=document.getElementById('module-resources');
if(!root)return;
const pane=root.querySelector('#resources-container'),viewer=root.querySelector('#resource-viewer');
const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const mobileQuery=window.matchMedia('(max-width: 767px)');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const ico=s=>'<i class="fa-solid fa-'+s+'" aria-hidden="true"></i>';
const user=()=>window.SJNResourcesBridge?.userId?.();
let owner=null,cache=null,loading=null,folder=null,active=null,expanded=false;
let request=null,pdfTask=null,pdfDoc=null,pdfjsPromise=null,openVersion=0;
let pageCount=0,currentPage=1,zoomPercent=100,renderEpoch=0,renderBusy=false,task=null,queuedFrame=0;
let pageRatios=[],baseWidth=0,previousFocus=null,readerLastFocused=null;
let gesture=null,zoomTimer=0,scrollFrame=0,resizeFrame=0;
const label=root.querySelector('.sjn-r-eyebrow')||root.querySelector('span.text-yellow-400');
if(label){label.classList.add('sjn-r-eyebrow');label.innerHTML=ico('layer-group')+' DIGITAL LIBRARY'}
function folderName(id){return cache?.folders.find(x=>x.id===id)?.name||'All Resources'}
function hasFiles(id){return cache?.files.filter(x=>x.folder_id===id).length||0}
function render(){
 if(!cache){pane.innerHTML='<p class="sjn-r-note">Select Academy Resources to view your library.</p>';return}
 const dirs=cache.folders.filter(x=>x.parent_id===folder);
 const files=cache.files.filter(x=>x.folder_id===folder);
 const parent=cache.folders.find(x=>x.id===folder)?.parent_id||null;
 const label=folderName(folder);
 const section=(title,count)=>'<div class="sjn-r-section-label"><span class="sjn-r-section-name">'+title+'</span><span class="sjn-r-section-count">'+count+'</span></div>';
 pane.innerHTML='<div class="sjn-r-browser-head"><div class="sjn-r-browser-kicker">'+ico('layer-group')+' DIGITAL LIBRARY</div>'+
 '<div class="sjn-r-browser-title">'+esc(label)+'</div><div class="sjn-r-browser-sub">'+(folder?'Explore documents in this collection':'Choose a collection to explore study materials')+'</div></div>'+
 (folder?'<button class="sjn-r-back" type="button" data-r-back>'+ico('arrow-left')+' Back to '+esc(parent?folderName(parent):'library')+'</button>':'')+
 (dirs.length?section('COLLECTIONS',dirs.length)+'<div class="sjn-r-card-grid sjn-r-collection-grid">'+
 dirs.map((x,i)=>'<button type="button" class="sjn-r-folder sjn-r-resource-card" data-r-folder="'+esc(x.id)+'" data-r-tone="'+i%4+'" aria-label="Explore collection '+esc(x.name)+'"><span class="sjn-r-card-top"><span class="sjn-r-folder-icon">'+ico('layer-group')+'</span><span class="sjn-r-card-type">COLLECTION</span></span><span class="sjn-r-folder-copy"><strong>'+esc(x.name)+'</strong><small>'+hasFiles(x.id)+' PDF '+(hasFiles(x.id)===1?'resource':'resources')+'</small></span><span class="sjn-r-card-footer"><span>Explore collection</span><span class="sjn-r-next">'+ico('arrow-right')+'</span></span></button>').join('')+'</div>':'')+
 (files.length?section('STUDY DOCUMENTS',files.length)+'<div class="sjn-r-card-grid sjn-r-document-grid">'+
 files.map((x,i)=>'<button type="button" class="sjn-r-document sjn-r-resource-card '+(active===x.id?'is-active':'')+'" data-r-file="'+esc(x.id)+'" data-r-tone="'+i%4+'" aria-label="Read '+esc(x.title)+'" aria-pressed="'+(active===x.id)+'"><span class="sjn-r-card-top"><span class="sjn-r-document-icon">'+ico('file-pdf')+'</span><span class="sjn-r-card-type">PDF RESOURCE</span></span><span class="sjn-r-document-copy"><strong>'+esc(x.title)+'</strong><small>Study material'+(x.size_bytes?' · '+(x.size_bytes>=1048576?(x.size_bytes/1048576).toFixed(1)+' MB':Math.max(1,Math.round(x.size_bytes/1024))+' KB'):'')+'</small></span><span class="sjn-r-card-footer"><span>'+ico('book-open')+' Read document</span><span class="sjn-r-next">'+ico('arrow-up-right-from-square')+'</span></span></button>').join('')+'</div>':'')+
 (!dirs.length&&!files.length?'<div class="sjn-r-empty">'+ico('book-open-reader')+'<p>No published documents in this collection yet.</p></div>':'');
}

function placeholder(){viewer.innerHTML=''}
function stopReader(){
 openVersion++;renderEpoch++;
 if(request){request.abort();request=null}
 if(task){try{task.cancel()}catch(_){ }task=null}
 if(pdfTask){try{void pdfTask.destroy()}catch(_){ }pdfTask=null}
 pdfDoc=null;pageCount=0;currentPage=1;zoomPercent=100;pageRatios=[];gesture=null;
 clearTimeout(zoomTimer);
 if(queuedFrame)cancelAnimationFrame(queuedFrame);
 if(scrollFrame)cancelAnimationFrame(scrollFrame);
 if(resizeFrame)cancelAnimationFrame(resizeFrame);
}
function closeReader(){
 const wasOpen=!!active;
 stopReader();active=null;expanded=false;
 root.classList.remove('sjn-r-expanded','sjn-r-reading');
 document.body.classList.remove('sjn-r-lock');
 placeholder();render();
 if(wasOpen&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 previousFocus=null;
}
function reset(){closeReader();owner=null;cache=null;folder=null;loading=null;render()}
function readerHeader(file){
 return '<div class="sjn-r-viewer-bar"><div class="sjn-r-reader-label"><span class="sjn-r-reader-icon">'+ico('file-pdf')+'</span><strong title="'+esc(file.title)+'">'+esc(file.title)+'</strong></div>'+
 '<div class="sjn-r-viewer-actions"><button type="button" data-r-expand title="Expand or restore reader">'+ico('expand')+'<span> Expand</span></button>'+
 '<button type="button" data-r-close title="Close reader">'+ico('xmark')+'<span> Close</span></button></div></div>';
}
function readerToolbar(){
 return '<div class="sjn-r-toolbar" role="toolbar" aria-label="PDF reading controls">'+
 '<div class="sjn-r-toolbar-group"><button type="button" data-r-page="prev" aria-label="Previous page">'+ico('chevron-left')+'</button>'+
 '<label class="sjn-r-number"><span class="sjn-r-sr">Page number</span><input class="sjn-r-page-input" data-r-page-input type="number" min="1" value="1" inputmode="numeric" aria-label="Go to page"></label>'+
 '<span class="sjn-r-total" data-r-total>/ …</span>'+
 '<button type="button" data-r-page="next" aria-label="Next page">'+ico('chevron-right')+'</button></div>'+
 '<span class="sjn-r-tool-separator"></span>'+
 '<div class="sjn-r-toolbar-group"><button type="button" data-r-zoom="out" aria-label="Zoom out">'+ico('minus')+'</button>'+
 '<label class="sjn-r-number sjn-r-zoom-number"><span class="sjn-r-sr">Zoom percentage</span><input data-r-zoom-input type="number" min="50" max="300" step="5" value="100" inputmode="numeric" aria-label="Zoom percentage"><span>%</span></label>'+
 '<button type="button" data-r-zoom="in" aria-label="Zoom in">'+ico('plus')+'</button>'+
 '<button type="button" class="sjn-r-fit" data-r-zoom="fit" title="Fit page width">Fit</button></div></div>';
}
function readerShell(file){
 root.classList.add('sjn-r-reading');
 document.body.classList.add('sjn-r-lock');
 viewer.setAttribute('role','dialog');
 viewer.setAttribute('aria-modal','true');
 viewer.setAttribute('aria-label','PDF reader: '+file.title);
 viewer.innerHTML=readerHeader(file)+readerToolbar()+
 '<div class="sjn-r-scroll" tabindex="0" aria-label="PDF pages, scroll to read continuously"><div class="sjn-r-pages"></div>'+
 '<div class="sjn-r-pdf-status" role="status">Loading secure document…</div></div>';
 viewer.querySelector('[data-r-close]')?.focus({preventScroll:true});
}
function status(msg){
 const el=viewer.querySelector('.sjn-r-pdf-status');if(el){el.hidden=!msg;el.textContent=msg||''}
}
function scroller(){return viewer.querySelector('.sjn-r-scroll')}
function stack(){return viewer.querySelector('.sjn-r-pages')}
function slots(){return [...viewer.querySelectorAll('.sjn-r-page-slot')]}
async function engine(){
 if(!pdfjsPromise)pdfjsPromise=import(PDFJS_URL).then(lib=>{
  lib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;return lib
 }).catch(err=>{pdfjsPromise=null;throw err});
 return pdfjsPromise;
}
function clamp(n,min,max){return Math.min(max,Math.max(min,n))}
function getWidth(){
 const el=scroller();if(!el)return 700;
 return mobileQuery.matches?Math.max(220,el.clientWidth-10):Math.min(860,Math.max(240,el.clientWidth-38));
}
function applySizes(){
 const el=scroller(),pages=stack();if(!el||!pages||!pageCount)return;
 baseWidth=getWidth();
 const width=baseWidth*zoomPercent/100;
 pages.style.width=Math.max(el.clientWidth,width+18)+'px';
 slots().forEach((slot,i)=>{
  const ratio=pageRatios[i]||pageRatios[0]||1.414;
  slot.style.width=width+'px';slot.style.height=(width*ratio)+'px';
  const c=slot.querySelector('canvas');
  if(c){c.style.width=width+'px';c.style.height=(width*ratio)+'px'}
 });
}
function buildSlots(){
 const el=stack();if(!el||!pdfDoc)return;
 el.innerHTML=Array.from({length:pageCount},(_,i)=>'<section class="sjn-r-page-slot" data-r-index="'+(i+1)+'" aria-label="Page '+(i+1)+'"><span class="sjn-r-page-loading">Page '+(i+1)+'</span></section>').join('');
 applySizes();status('');
}
function currentVisible(){
 const el=scroller();if(!el)return;
 const center=el.scrollTop+el.clientHeight*.43;
 const list=slots();if(!list.length)return;
 let best=1,dist=Infinity;
 for(let i=0;i<list.length;i++){
  const node=list[i],mid=node.offsetTop+node.offsetHeight/2;
  const d=Math.abs(mid-center);
  if(d<dist){dist=d;best=i+1}
 }
 currentPage=best;updateControls();
}
function updateControls(){
 const page=viewer.querySelector('[data-r-page-input]');
 if(page&&document.activeElement!==page){page.value=currentPage;page.max=pageCount}
 const total=viewer.querySelector('[data-r-total]');if(total)total.textContent='/ '+(pageCount||'…');
 const zoom=viewer.querySelector('[data-r-zoom-input]');if(zoom&&document.activeElement!==zoom)zoom.value=zoomPercent;
 const prev=viewer.querySelector('[data-r-page="prev"]'),next=viewer.querySelector('[data-r-page="next"]');
 if(prev)prev.disabled=currentPage<=1;if(next)next.disabled=currentPage>=pageCount;
 const out=viewer.querySelector('[data-r-zoom="out"]'),inc=viewer.querySelector('[data-r-zoom="in"]');
 if(out)out.disabled=zoomPercent<=50;if(inc)inc.disabled=zoomPercent>=300;
}
function visibleIndices(){
 const el=scroller();if(!el)return [];
 const top=el.scrollTop,bot=top+el.clientHeight;
 return slots().map((x,i)=>({i:i+1,top:x.offsetTop,bot:x.offsetTop+x.offsetHeight})).filter(x=>x.bot>top-el.clientHeight&&x.top<bot+el.clientHeight)
 .sort((a,b)=>Math.abs((a.top+a.bot)/2-(top+bot)/2)-Math.abs((b.top+b.bot)/2-(top+bot)/2)).map(x=>x.i);
}
function pruneCanvas(){
 const el=scroller();if(!el)return;
 const top=el.scrollTop,bot=top+el.clientHeight;
 slots().forEach(x=>{
  if(x.offsetTop+x.offsetHeight<top-el.clientHeight*2||x.offsetTop>bot+el.clientHeight*2){
   const canvas=x.querySelector('canvas');if(canvas){canvas.width=0;canvas.height=0;canvas.remove();delete x.dataset.renderKey}
  }
 });
}
function scheduleRender(){
 if(!pdfDoc||renderBusy)return;
 const key=zoomPercent+'';
 const n=visibleIndices().find(i=>{
  const sl=viewer.querySelector('.sjn-r-page-slot[data-r-index="'+i+'"]');
  return sl&&!sl.querySelector('canvas')&&sl.dataset.renderKey!==key;
 });
 if(!n)return;
 void drawPage(n,renderEpoch);
}
async function drawPage(n,epoch){
 if(renderBusy||!pdfDoc)return;renderBusy=true;
 const slot=viewer.querySelector('.sjn-r-page-slot[data-r-index="'+n+'"]');
 const doc=pdfDoc,scaleZoom=zoomPercent;
 try{
  const page=await doc.getPage(n);
  if(epoch!==renderEpoch||doc!==pdfDoc||!slot?.isConnected)return;
  const viewportBase=page.getViewport({scale:1});
  const ratio=viewportBase.height/viewportBase.width;
  if(Math.abs((pageRatios[n-1]||ratio)-ratio)>.005){pageRatios[n-1]=ratio;applySizes()}
  const displayWidth=baseWidth*scaleZoom/100,scale=displayWidth/viewportBase.width;
  const viewport=page.getViewport({scale});
  const dpr=Math.max(.5,Math.min(window.devicePixelRatio||1,2,Math.sqrt(5500000/(viewport.width*viewport.height))));
  const canvas=document.createElement('canvas');
  canvas.width=Math.round(viewport.width*dpr);canvas.height=Math.round(viewport.height*dpr);
  canvas.style.width=displayWidth+'px';canvas.style.height=(displayWidth*ratio)+'px';
  canvas.setAttribute('aria-label','Rendered page '+n);
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw Error('Canvas not available');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  task=page.render({canvasContext:ctx,viewport});
  await task.promise;
  if(epoch!==renderEpoch||doc!==pdfDoc||!slot.isConnected)return;
  slot.querySelector('canvas')?.remove();slot.appendChild(canvas);
  slot.dataset.renderKey=scaleZoom+'';
  slot.querySelector('.sjn-r-page-loading')?.remove();
 }catch(err){
  if(epoch===renderEpoch&&err?.name!=='RenderingCancelledException')status('A page could not render. Scroll away and back, or reopen the document.');
 }finally{
  task=null;renderBusy=false;
  if(pdfDoc&&viewer.querySelector('.sjn-r-scroll'))scheduleRender();
 }
}
function onScroll(){
 if(scrollFrame)cancelAnimationFrame(scrollFrame);
 scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;currentVisible();pruneCanvas();scheduleRender()});
}
function goToPage(n){
 if(!pdfDoc)return;
 n=clamp(Math.round(Number(n)||1),1,pageCount);
 const slot=viewer.querySelector('.sjn-r-page-slot[data-r-index="'+n+'"]');
 if(slot){scroller().scrollTo({top:slot.offsetTop-6,behavior:'auto'});currentPage=n;updateControls();onScroll()}
}
function setZoom(value,opt={}){
 if(!pdfDoc)return;
 const v=clamp(Math.round(Number(value)||100),50,300);
 if(v===zoomPercent)return;
 const el=scroller(),oldWidth=baseWidth*zoomPercent/100;
 const centerX=el.scrollLeft+el.clientWidth/2;
 const centerY=el.scrollTop+el.clientHeight/2;
 const factor=v/zoomPercent;
 zoomPercent=v;renderEpoch++;
 if(task){try{task.cancel()}catch(_){ }}
 applySizes();
 // Preserve approximately the same reading position while scaling.
 el.scrollLeft=Math.max(0,centerX*factor-el.clientWidth/2);
 el.scrollTop=Math.max(0,centerY*factor-el.clientHeight/2);
 slots().forEach(x=>{const c=x.querySelector('canvas');if(c){c.style.width=baseWidth*zoomPercent/100+'px';c.style.height=x.style.height}});
 updateControls();
 if(!opt.preview){
  clearTimeout(zoomTimer);
  zoomTimer=setTimeout(()=>{slots().forEach(x=>{x.querySelector('canvas')?.remove();delete x.dataset.renderKey});scheduleRender()},120);
 }
}
function finishZoom(){
 if(!pdfDoc)return;
 clearTimeout(zoomTimer);renderEpoch++;
 if(task){try{task.cancel()}catch(_){ }}
 slots().forEach(x=>{x.querySelector('canvas')?.remove();delete x.dataset.renderKey});
 scheduleRender();
}
function setExpanded(val){
 expanded=!!val;root.classList.toggle('sjn-r-expanded',expanded);
 const button=viewer.querySelector('[data-r-expand]');
 if(button)button.innerHTML=ico(expanded?'compress':'expand')+'<span>'+(expanded?' Restore':' Expand')+'</span>';
 if(pdfDoc)requestAnimationFrame(()=>{const n=currentPage;applySizes();finishZoom();goToPage(n)});
}
async function openFile(id){
 const file=cache?.files.find(x=>x.id===id);if(!file)return;
 previousFocus=document.activeElement;
 stopReader();active=id;expanded=false;
 root.classList.remove('sjn-r-expanded');render();readerShell(file);
 const v=openVersion,uid=owner;
 try{
  const link=await window.SJNResourcesBridge.load('/academy-resources/'+encodeURIComponent(id)+'/open');
  if(v!==openVersion||uid!==owner||uid!==user())return;
  const [lib,data]=await Promise.all([
   engine(),(async()=>{
    request=new AbortController();
    const res=await fetch(link.url,{signal:request.signal,credentials:'omit',cache:'no-store'});
    if(!res.ok)throw Error('PDF request failed ('+res.status+')');
    const buf=await res.arrayBuffer();if(buf.byteLength>50*1024*1024)throw Error('PDF exceeds reader limit');
    return new Uint8Array(buf)
   })()
  ]);
  if(v!==openVersion||uid!==owner||uid!==user())return;
  pdfTask=lib.getDocument({data});
  const doc=await pdfTask.promise;
  if(v!==openVersion||uid!==owner||uid!==user()){void doc.destroy();return}
  pdfDoc=doc;pageCount=doc.numPages;currentPage=1;
  if(!pageCount)throw Error('No pages in PDF');
  const first=await doc.getPage(1);
  if(v!==openVersion||uid!==owner||uid!==user())return;
  const vp=first.getViewport({scale:1});
  pageRatios=Array(pageCount).fill(vp.height/vp.width);
  buildSlots();updateControls();goToPage(1);scheduleRender();
 }catch(err){
  if(v!==openVersion||err?.name==='AbortError')return;
  status('Unable to display this PDF in the reader. Please close and retry.');
 }
}
root.addEventListener('click',e=>{
 const dir=e.target.closest('[data-r-folder]'),file=e.target.closest('[data-r-file]');
 if(dir){folder=dir.dataset.rFolder;closeReader();render()}
 else if(file)void openFile(file.dataset.rFile);
 else if(e.target.closest('[data-r-back]')){folder=cache?.folders.find(x=>x.id===folder)?.parent_id||null;closeReader();render()}
 else if(e.target.closest('[data-r-close]'))closeReader();
 else if(e.target.closest('[data-r-expand]'))setExpanded(!expanded);
 else if(e.target.closest('[data-r-page]')&&pdfDoc){goToPage(currentPage+(e.target.closest('[data-r-page]').dataset.rPage==='next'?1:-1))}
 else if(e.target.closest('[data-r-zoom]')&&pdfDoc){
  const action=e.target.closest('[data-r-zoom]').dataset.rZoom;
  setZoom(action==='fit'?100:zoomPercent+(action==='in'?25:-25));
 }
});
viewer.addEventListener('change',e=>{
 if(e.target.matches('[data-r-page-input]'))goToPage(e.target.value);
 if(e.target.matches('[data-r-zoom-input]'))setZoom(e.target.value);
 updateControls();
});
viewer.addEventListener('scroll',e=>{if(e.target===scroller())onScroll()},true);
viewer.addEventListener('wheel',e=>{
 if(!pdfDoc||!e.ctrlKey||!scroller()?.contains(e.target))return;
 e.preventDefault();setZoom(zoomPercent+(e.deltaY<0?10:-10));
},{passive:false});
function distance(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)}
viewer.addEventListener('touchstart',e=>{
 if(!pdfDoc||!scroller()?.contains(e.target))return;
 if(e.touches.length===2){gesture={dist:distance(e.touches),zoom:zoomPercent};clearTimeout(zoomTimer)}
},{passive:true});
viewer.addEventListener('touchmove',e=>{
 if(!gesture||!pdfDoc||e.touches.length!==2)return;
 e.preventDefault();const next=gesture.zoom*distance(e.touches)/Math.max(1,gesture.dist);
 setZoom(next,{preview:true});updateControls();
},{passive:false});
viewer.addEventListener('touchend',e=>{
 if(gesture&&e.touches.length<2){gesture=null;finishZoom()}
},{passive:true});
viewer.addEventListener('touchcancel',()=>{if(gesture){gesture=null;finishZoom()}},{passive:true});
document.addEventListener('keydown',e=>{
 if(!active||!root.classList.contains('sjn-r-reading'))return;
 if(e.key==='Escape'){e.preventDefault();closeReader();return}
 if(e.key==='Tab'){
  const choices=[...viewer.querySelectorAll('button:not(:disabled),input:not(:disabled),.sjn-r-scroll')];
  const first=choices[0],last=choices[choices.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
 }
 if(e.target.matches?.('input'))return;
 if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();goToPage(currentPage+1)}
 if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();goToPage(currentPage-1)}
});
const resizeObserver=new ResizeObserver(()=>{
 if(!pdfDoc||resizeFrame)return;
 resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;const page=currentPage;applySizes();finishZoom();goToPage(page)});
});
resizeObserver.observe(viewer);
const moduleObserver=new MutationObserver(()=>{if(root.classList.contains('hidden')&&active)closeReader()});
moduleObserver.observe(root,{attributes:true,attributeFilter:['class']});
window.SJNResources={
 async enter(){
  const uid=user();if(!uid)return;
  if(owner!==uid)reset();
  if(cache||loading)return loading;
  owner=uid;pane.innerHTML='<p class="sjn-r-note">Loading academy library…</p>';
  loading=window.SJNResourcesBridge.load('/academy-resources').then(data=>{
   if(owner!==uid)return;
   cache={folders:Array.isArray(data.folders)?data.folders:[],files:Array.isArray(data.files)?data.files:[]};
   render();
  }).catch(err=>{if(owner===uid)pane.innerHTML='<p class="sjn-r-note">'+esc(err.message||'Library temporarily unavailable')+'</p>'}).finally(()=>{loading=null});
  return loading;
 },
 reset
};
placeholder();render();
})();