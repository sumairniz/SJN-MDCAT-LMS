(()=>{'use strict';
const root=document.getElementById('module-resources');
if(!root)return;
let owner=null,cache=null,loading=null,folder=null,active=null,expanded=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pane=root.querySelector('#resources-container'),viewer=root.querySelector('#resource-viewer');
function render(){
 if(!cache){pane.innerHTML='<p class="sjn-r-note">Open Academy Resources to browse published folders.</p>';return}
 const list=cache.folders.filter(x=>x.parent_id===folder);
 const files=cache.files.filter(x=>x.folder_id===folder);
 const parent=cache.folders.find(x=>x.id===folder)?.parent_id??null;
 pane.innerHTML='<div class="sjn-r-toolbar"><strong>'+(folder?esc(cache.folders.find(x=>x.id===folder)?.name):'All Resources')+'</strong><span>'+files.length+' PDFs</span></div>'+
 (folder?'<button type="button" class="sjn-r-row" data-r-back>← Back to '+(parent?'parent folder':'library')+'</button>':'')+
 list.map(x=>'<button type="button" class="sjn-r-row" data-r-folder="'+esc(x.id)+'"><span>📁</span><span>'+esc(x.name)+'</span><span class="sjn-r-arrow">›</span></button>').join('')+
 files.map(x=>'<button type="button" class="sjn-r-row '+(active===x.id?'is-active':'')+'" data-r-file="'+esc(x.id)+'"><span>📄</span><span>'+esc(x.title)+'</span><small>PDF</small></button>').join('')+
 (!list.length&&!files.length?'<p class="sjn-r-note">No published files in this folder yet.</p>':'');
}
function clearViewer(){viewer.innerHTML='<div class="sjn-r-placeholder"><span>📄</span><strong>Select a PDF to read</strong><p>Your document opens here without leaving the LMS.</p></div>'}
function reset(){owner=null;cache=null;folder=null;active=null;loading=null;expanded=false;root.classList.remove('sjn-r-expanded');clearViewer();render()}
async function openFile(id){
 const file=cache?.files.find(x=>x.id===id);if(!file)return;
 active=id;render();viewer.innerHTML='<div class="sjn-r-placeholder">Opening verified PDF…</div>';
 try{
  const x=await window.SJNResourcesBridge.load('/academy-resources/'+encodeURIComponent(id)+'/open');
  if(owner!==window.SJNResourcesBridge.userId())return;
  viewer.innerHTML='<div class="sjn-r-viewer-bar"><strong>'+esc(file.title)+'</strong><div><button type="button" data-r-expand>⛶ '+(expanded?'Restore':'Expand')+'</button><button type="button" data-r-close>Close</button></div></div>'+
  '<iframe class="sjn-r-frame" title="'+esc(file.title)+'" referrerpolicy="no-referrer" src="'+esc(x.url)+'#toolbar=1"></iframe>';
 }catch(e){viewer.innerHTML='<div class="sjn-r-placeholder">'+esc(e.message||'Unable to open PDF')+'</div>'}
}
root.addEventListener('click',e=>{
 const f=e.target.closest('[data-r-folder]'),d=e.target.closest('[data-r-file]');
 if(f){folder=f.dataset.rFolder;active=null;clearViewer();render()}
 else if(d)void openFile(d.dataset.rFile);
 else if(e.target.closest('[data-r-back]')){folder=cache?.folders.find(x=>x.id===folder)?.parent_id??null;active=null;clearViewer();render()}
 else if(e.target.closest('[data-r-expand]')){expanded=!expanded;root.classList.toggle('sjn-r-expanded',expanded);const b=root.querySelector('[data-r-expand]');if(b)b.textContent=expanded?'⤢ Restore':'⛶ Expand'}
 else if(e.target.closest('[data-r-close]')){active=null;expanded=false;root.classList.remove('sjn-r-expanded');clearViewer();render()}
});
window.SJNResources={
 async enter(){
  const uid=window.SJNResourcesBridge?.userId?.();
  if(!uid)return;
  if(owner!==uid)reset();
  if(cache||loading)return loading;
  owner=uid;pane.innerHTML='<p class="sjn-r-note">Loading resources…</p>';
  loading=window.SJNResourcesBridge.load('/academy-resources').then(data=>{
   if(owner!==uid)return;
   cache={folders:Array.isArray(data.folders)?data.folders:[],files:Array.isArray(data.files)?data.files:[]};
   render();
  }).catch(e=>{if(owner===uid)pane.innerHTML='<p class="sjn-r-note">'+esc(e.message||'Resources unavailable')+'</p>'}).finally(()=>{loading=null});
  return loading;
 },
 reset
};
clearViewer();render();
})();