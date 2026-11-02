(()=>{
'use strict';
const root=document.getElementById('module-resources');
if(!root)return;
const pane=root.querySelector('#resources-container'),viewer=root.querySelector('#resource-viewer');
const mobileQuery=window.matchMedia('(max-width: 767px)');
const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
let owner=null,cache=null,loading=null,folder=null,active=null,expanded=false;
let request=null,pdfTask=null,pdfDoc=null,renderTask=null,openVersion=0,renderVersion=0;
let currentPage=1,pageCount=0,mobileZoom=1,desktopZoom=100,pdfjsPromise=null,previousFocus=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const ico=(name)=>'<i class="fa-solid fa-'+name+'" aria-hidden="true"></i>';
const user=()=>window.SJNResourcesBridge?.userId?.();
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
function placeholder(){
 viewer.innerHTML='<div class="sjn-r-placeholder"><span class="sjn-r-placeholder-icon">'+ico('book-open-reader')+'</span><strong>Your study space</strong><p>Select a document from the library to start reading.</p></div>';
}
function stopReader(){
 openVersion++;renderVersion++;
 if(request){request.abort();request=null}
 if(renderTask){try{renderTask.cancel()}catch(_){ }renderTask=null}
 if(pdfTask){try{void pdfTask.destroy()}catch(_){ }pdfTask=null}
 pdfDoc=null;pageCount=0;currentPage=1;mobileZoom=1;desktopZoom=100;
}
function closeReader(){
 stopReader();active=null;expanded=false;
 root.classList.remove('sjn-r-expanded','sjn-r-reading');
 document.body.classList.remove('sjn-r-lock');
 placeholder();render();
 if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 previousFocus=null;
}
function reset(){
 closeReader();owner=null;cache=null;folder=null;loading=null;render();
}
function setExpanded(value){
 expanded=!!value;
 root.classList.toggle('sjn-r-expanded',expanded);
 document.body.classList.toggle('sjn-r-lock',expanded);
 const b=viewer.querySelector('[data-r-expand]');
 if(b)b.innerHTML=ico(expanded?'compress':'expand')+(expanded?' Restore':' Expand');
 if(mobileQuery.matches&&pdfDoc)void renderMobilePage();
}
function readerHeader(file){
 return '<div class="sjn-r-viewer-bar"><div class="sjn-r-reader-label"><span class="sjn-r-reader-icon">'+ico('file-pdf')+'</span><div><span class="sjn-r-reader-kicker">ACADEMY READER</span><strong title="'+esc(file.title)+'">'+esc(file.title)+'</strong></div></div>'+
 '<div class="sjn-r-viewer-actions"><button type="button" class="sjn-r-mobile-back" data-r-close>'+ico('arrow-left')+' Files</button>'+
 '<button type="button" data-r-expand>'+ico('expand')+' Expand</button><button type="button" class="sjn-r-desktop-close" data-r-close>'+ico('xmark')+' Close</button></div></div>';
}
function desktopFrame(url){
 viewer.innerHTML=readerHeader(cache.files.find(x=>x.id===active))+
 '<div class="sjn-r-native-hint">'+ico('shield-halved')+' Read in Academy Resources</div>'+
 '<iframe class="sjn-r-frame" title="Academy PDF reader" referrerpolicy="no-referrer" src="'+esc(url)+'#toolbar=0&navpanes=0&scrollbar=1"></iframe>';
}
function mobileShell(file){
 root.classList.add('sjn-r-reading');
 viewer.innerHTML=readerHeader(file)+
 '<div class="sjn-r-pdf-controls"><button type="button" data-r-page="prev" aria-label="Previous page">'+ico('chevron-left')+'</button>'+
 '<span class="sjn-r-page-status">Preparing PDF…</span>'+
 '<button type="button" data-r-page="next" aria-label="Next page">'+ico('chevron-right')+'</button>'+
 '<span class="sjn-r-zoom-gap"></span><button type="button" data-r-zoom="out" aria-label="Zoom out">'+ico('minus')+'</button>'+
 '<span class="sjn-r-zoom-label">Fit</span><button type="button" data-r-zoom="in" aria-label="Zoom in">'+ico('plus')+'</button></div>'+
 '<div class="sjn-r-mobile-page"><div class="sjn-r-pdf-status" role="status">Loading the secure document…</div><canvas class="sjn-r-pdf-canvas" aria-label="PDF page"></canvas></div>';
}
async function pdfEngine(){
 if(!pdfjsPromise)pdfjsPromise=import(PDFJS_URL).then(pdfjs=>{
   pdfjs.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;return pdfjs;
 }).catch(err=>{pdfjsPromise=null;throw err});
 return pdfjsPromise;
}
function showMobileStatus(text){
 const s=viewer.querySelector('.sjn-r-pdf-status');if(s){s.textContent=text;s.hidden=false}
}
function updatePagination(){
 const t=viewer.querySelector('.sjn-r-page-status');if(t)t.textContent=pageCount?'Page '+currentPage+' of '+pageCount:'Preparing PDF…';
 const prev=viewer.querySelector('[data-r-page="prev"]'),next=viewer.querySelector('[data-r-page="next"]');
 if(prev)prev.disabled=currentPage<=1;
 if(next)next.disabled=currentPage>=pageCount;
 const z=viewer.querySelector('.sjn-r-zoom-label');if(z)z.textContent=mobileZoom===1?'Fit':Math.round(mobileZoom*100)+'%';
}
async function renderMobilePage(){
 if(!pdfDoc||!mobileQuery.matches)return;
 const v=++renderVersion,doc=pdfDoc;
 const earlier=renderTask;
 if(earlier){try{earlier.cancel();await earlier.promise}catch(_){ }}
 if(v!==renderVersion||doc!==pdfDoc)return;
 try{
  const page=await doc.getPage(currentPage);
  if(v!==renderVersion||doc!==pdfDoc)return;
  const holder=viewer.querySelector('.sjn-r-mobile-page'),canvas=viewer.querySelector('.sjn-r-pdf-canvas');
  if(!holder||!canvas)return;
  const base=page.getViewport({scale:1}),available=Math.max(240,holder.clientWidth-20);
  const scale=available/base.width*mobileZoom;
  const viewport=page.getViewport({scale});
  const dpr=Math.min(window.devicePixelRatio||1,2,Math.sqrt(6500000/(viewport.width*viewport.height)));
  canvas.width=Math.max(1,Math.round(viewport.width*dpr));
  canvas.height=Math.max(1,Math.round(viewport.height*dpr));
  canvas.style.width=Math.round(viewport.width)+'px';
  canvas.style.height=Math.round(viewport.height)+'px';
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw Error('Canvas unavailable');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  showMobileStatus('Rendering page '+currentPage+'…');
  renderTask=page.render({canvasContext:ctx,viewport});
  await renderTask.promise;
  if(v!==renderVersion||doc!==pdfDoc)return;
  const status=viewer.querySelector('.sjn-r-pdf-status');if(status)status.hidden=true;
  updatePagination();
  if(holder)holder.scrollTop=0;
 }catch(err){
  if(v!==renderVersion||err?.name==='RenderingCancelledException')return;
  showMobileStatus('This page could not be displayed. Try another page or reopen the file.');
 }
}
async function openFile(id){
 const file=cache?.files.find(x=>x.id===id);if(!file)return;
 previousFocus=document.activeElement;
 stopReader();active=id;expanded=false;root.classList.remove('sjn-r-expanded');
 render();
 const v=openVersion,uid=owner;
 viewer.innerHTML='<div class="sjn-r-placeholder">'+ico('spinner')+'<strong>Opening document securely…</strong></div>';
 try{
  const link=await window.SJNResourcesBridge.load('/academy-resources/'+encodeURIComponent(id)+'/open');
  if(v!==openVersion||uid!==owner||uid!==user())return;
  if(!mobileQuery.matches){desktopFrame(link.url);return}
  mobileShell(file);
  const [pdfjs,bytes]=await Promise.all([
   pdfEngine(),
   (async()=>{request=new AbortController();const res=await fetch(link.url,{signal:request.signal,credentials:'omit',cache:'no-store'});if(!res.ok)throw Error('Unable to retrieve PDF ('+res.status+').');const data=await res.arrayBuffer();if(data.byteLength>45*1024*1024)throw Error('Document is too large for the mobile reader.');return new Uint8Array(data)})()
  ]);
  if(v!==openVersion||uid!==owner||uid!==user())return;
  pdfTask=pdfjs.getDocument({data:bytes});
  const doc=await pdfTask.promise;
  if(v!==openVersion||uid!==owner||uid!==user()){void doc.destroy();return}
  pdfDoc=doc;pageCount=doc.numPages;currentPage=1;updatePagination();await renderMobilePage();
 }catch(err){
  if(v!==openVersion||err?.name==='AbortError')return;
  if(mobileQuery.matches){
   showMobileStatus('The PDF could not be displayed here. Please retry or contact academy support.');
  }else viewer.innerHTML='<div class="sjn-r-placeholder">Could not open the document. Please try again.</div>';
 }
}
root.addEventListener('click',e=>{
 const f=e.target.closest('[data-r-folder]'),d=e.target.closest('[data-r-file]');
 if(f){folder=f.dataset.rFolder;closeReader();render()}
 else if(d)void openFile(d.dataset.rFile);
 else if(e.target.closest('[data-r-back]')){folder=cache?.folders.find(x=>x.id===folder)?.parent_id||null;closeReader();render()}
 else if(e.target.closest('[data-r-close]'))closeReader();
 else if(e.target.closest('[data-r-expand]'))setExpanded(!expanded);
 else if(e.target.closest('[data-r-page]')&&pdfDoc){
   const delta=e.target.closest('[data-r-page]').dataset.rPage==='next'?1:-1;
   currentPage=Math.max(1,Math.min(pageCount,currentPage+delta));updatePagination();void renderMobilePage();
 }else if(e.target.closest('[data-r-zoom]')&&pdfDoc){
   const z=e.target.closest('[data-r-zoom]').dataset.rZoom==='in'?.2:-.2;
   mobileZoom=Math.max(.6,Math.min(2.2,Math.round((mobileZoom+z)*10)/10));
   updatePagination();void renderMobilePage();
 }
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(expanded||root.classList.contains('sjn-r-reading')))closeReader()});
mobileQuery.addEventListener?.('change',()=>{if(active)closeReader()});
window.SJNResources={
 async enter(){
  const uid=user();if(!uid)return;
  if(owner!==uid)reset();
  if(cache||loading)return loading;
  owner=uid;pane.innerHTML='<p class="sjn-r-note">Loading your academy library…</p>';
  loading=window.SJNResourcesBridge.load('/academy-resources').then(data=>{
   if(owner!==uid)return;
   cache={folders:Array.isArray(data.folders)?data.folders:[],files:Array.isArray(data.files)?data.files:[]};
   render();
  }).catch(e=>{if(owner===uid)pane.innerHTML='<p class="sjn-r-note">'+esc(e.message||'Library temporarily unavailable')+'</p>'}).finally(()=>{loading=null});
  return loading;
 },
 reset
};
placeholder();render();
})();