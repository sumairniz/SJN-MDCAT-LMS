// SJN MedNest syllabus-first owner-controlled management.
// Independent staff Auth only. Old MCQ-assigned topics are not canonical.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL="https://tdqbjhrmfluiinntmjfh.supabase.co";
const KEY="sb_publishable_Redb-pOjNOSpDKg1uIbUBg_-PUCt5XX";
const client=createClient(URL,KEY,{auth:{
 persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,
 storageKey:"sjn-mednest-isolated-staff-v1"
}});
const API=URL+"/functions/v1/mednest-syllabus";
const $=id=>document.getElementById(id);
const normalize=x=>String(x??"").normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("en");
let nodes=[],selected=null,preview=[],busy=false,loaded=false;
const status=(message,error=false)=>{
 const el=$("syllabus-feedback");if(!el)return;
 el.textContent=message;el.dataset.error=String(error);
};
const importStatus=(message,error=false)=>{
 $("syllabus-import-feedback").textContent=message;
 $("syllabus-import-feedback").dataset.error=String(error);
};
function opt(select,value,label){
 select.append(new Option(label,value));
}
function updateStats(){
 for(const kind of ["subject","chapter","topic"]){
  $("syllabus-"+kind+"-count").textContent=String(nodes.filter(n=>n.kind===kind&&n.state!=="archived").length);
 }
 $("syllabus-approved-count").textContent=String(nodes.filter(n=>n.kind==="topic"&&n.state==="active").length);
}
const nodeById=id=>nodes.find(n=>n.id===id);
function pathOf(node){
 const names=[node.name];
 let parent=node.parent_id,count=0;
 while(parent&&count++<3){const next=nodeById(parent);if(!next)break;names.unshift(next.name);parent=next.parent_id;}
 return names.join(" → ");
}
function renderParents(){
 const kind=$("syllabus-kind").value,list=$("syllabus-parent"),value=list.value;
 list.replaceChildren(new Option(kind==="subject"?"No parent":"Select parent", ""));
 if(kind!=="subject"){
  const expected=kind==="chapter"?"subject":"chapter";
  for(const n of nodes.filter(x=>x.kind===expected&&x.state!=="archived")
      .sort((a,b)=>pathOf(a).localeCompare(pathOf(b)))){
   opt(list,n.id,pathOf(n)+" ["+n.state+"]");
  }
 }
 if([...list.options].some(o=>o.value===value))list.value=value;
}
function selectNode(node){
 selected=node?.id||null;
 if(!node){
  $("syllabus-selection").textContent="No syllabus item selected. Create a subject, chapter or topic.";
  return;
 }
 $("syllabus-kind").value=node.kind;
 renderParents();
 $("syllabus-parent").value=node.parent_id||"";
 $("syllabus-name").value=node.name;
 $("syllabus-selection").textContent="Selected "+pathOf(node)+" · "+node.state.toUpperCase()+
  " · Revision "+node.revision+" · Stable ID "+node.id;
}
function renderTree(){
 updateStats();
 const container=$("syllabus-tree");container.replaceChildren();
 const q=normalize($("syllabus-search").value),includeArchived=$("syllabus-filter").value==="all";
 const base=nodes.filter(n=>includeArchived||n.state!=="archived");
 if(!base.length){
  const p=document.createElement("p");p.textContent="Your master syllabus is empty. Add a subject or import your syllabus outline.";
  container.append(p);renderParents();return;
 }
 let visible=new Set(base.map(n=>n.id));
 if(q){
  const keep=new Set();
  for(const n of base){
   if(!normalize(pathOf(n)).includes(q))continue;
   let current=n,count=0;
   while(current&&count++<4){keep.add(current.id);current=nodeById(current.parent_id);}
  }
  visible=new Set([...keep].filter(id=>base.some(n=>n.id===id)));
 }
 const rows=base.filter(n=>visible.has(n.id));
 const depth={subject:0,chapter:1,topic:2};
 rows.sort((a,b)=>pathOf(a).localeCompare(pathOf(b))||depth[a.kind]-depth[b.kind]);
 if(!rows.length){
  const p=document.createElement("p");p.textContent="No matching syllabus items.";container.append(p);
 }
 for(const n of rows){
  const btn=document.createElement("button");
  btn.type="button";btn.className="syllabus-node syllabus-node--"+n.kind+
   (selected===n.id?" syllabus-node--selected":"");
  btn.style.paddingInlineStart=(13+(depth[n.kind]*22))+"px";
  const symbol=document.createElement("span");symbol.className="syllabus-node-symbol";
  symbol.textContent=n.kind==="subject"?"▦":n.kind==="chapter"?"▸":"•";
  const label=document.createElement("span");label.textContent=n.name;
  const badge=document.createElement("small");badge.textContent=n.state.toUpperCase();
  btn.append(symbol,label,badge);
  btn.addEventListener("click",()=>{selectNode(n);renderTree()});
  container.append(btn);
 }
 renderParents();
}
function extractActiveEntries(){
 const active=nodes.filter(n=>n.state==="active");
 const map=new Map(active.map(n=>[n.id,n]));
 return active.filter(n=>n.kind==="topic").flatMap(topic=>{
  const chapter=map.get(topic.parent_id);
  const subject=chapter&&map.get(chapter.parent_id);
  if(!chapter||chapter.kind!=="chapter"||!subject||subject.kind!=="subject")return [];
  return [{subject:subject.name,chapter:chapter.name,topic:topic.name,usage_count:1}];
 });
}
window.MedNestSyllabus=Object.freeze({
 getActiveEntries:()=>extractActiveEntries(),
 refresh:()=>loadAll()
});
function dispatch(){
 window.dispatchEvent(new CustomEvent("mednest:syllabus-updated",{detail:{
  entries:extractActiveEntries(),loaded
 }}));
}
async function call(action,fields={}){
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session?.access_token)throw Error("Sign in as Chief Administrator to manage the academy syllabus.");
 const res=await fetch(API,{method:"POST",credentials:"omit",cache:"no-store",
  headers:{"content-type":"application/json","apikey":KEY,
   authorization:"Bearer "+session.access_token},
  body:JSON.stringify({action,...fields})
 });
 const json=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(json.error||"Syllabus service rejected the request");
 return json;
}
async function loadAll(){
 const collected=[];
 for(let offset=0;offset<=10000;offset+=200){
  const r=await call("syllabus.list",{offset});
  collected.push(...r.nodes);
  if(!r.has_more)break;
  if(offset>=10000)throw Error("Syllabus exceeds the current management listing size.");
 }
 nodes=collected;loaded=true;
 if(selected&&!nodeById(selected))selected=null;
 renderTree();dispatch();
 status("Loaded "+nodes.length+" independent syllabus records. Student MCQ topics remain untouched.");
 return nodes;
}
const mutationBusy=state=>{
 busy=state;
 for(const id of ["syllabus-create","syllabus-rename","syllabus-move","syllabus-activate",
 "syllabus-archive","syllabus-restore","syllabus-import","syllabus-refresh"])
  $(id).disabled=state||id==="syllabus-import"&&(!preview.length||preview.some(x=>x.errors.length));
};
async function perform(operation){
 if(busy)return;
 const node=nodeById(selected),kind=$("syllabus-kind").value,
  name=$("syllabus-name").value.trim(),parent=$("syllabus-parent").value||null;
 if(operation!=="create"&&!node){status("Select an existing chapter/topic/subject first.",true);return;}
 if(operation==="archive"&&!window.confirm("Archive "+pathOf(node)+" and all its descendants? They will remain recoverable and student questions will not be deleted."))return;
 if(operation==="activate"&&!window.confirm("Approve the draft syllabus under "+pathOf(node)+"? This does not yet change the Student LMS."))return;
 if(operation==="move"&&!window.confirm("Move "+pathOf(node)+" to the selected parent? Stable IDs remain unchanged."))return;
 mutationBusy(true);
 try{
  const r=await call("syllabus.change",{operation,node_id:node?.id||null,
   kind:operation==="create"?kind:node?.kind,
   parent_id:parent,name});
  await loadAll();
  if(r.result?.id){selectNode(nodeById(r.result.id));renderTree();}
  status("Syllabus "+operation+" completed. Student MCQs and historical attempts were not modified.");
 }catch(e){status(e.message,true)}
 finally{mutationBusy(false)}
}
for(const action of ["create","rename","move","archive","restore","activate"])
 $("syllabus-"+action).addEventListener("click",()=>perform(action));
$("syllabus-kind").addEventListener("change",renderParents);
$("syllabus-search").addEventListener("input",renderTree);
$("syllabus-filter").addEventListener("change",renderTree);
$("syllabus-refresh").addEventListener("click",()=>loadAll().catch(e=>status(e.message,true)));
function csvRows(text){
 const parser=window.MedNestContentStudio?.parseCSV;
 if(!parser)throw Error("Syllabus CSV parser is not ready.");
 const rows=parser(text);
 if(!rows.length)throw Error("Syllabus file is empty.");
 const first=rows[0].map(normalize);
 if(first[0]==="subject"&&first[1]==="chapter"&&first[2]==="topic")rows.shift();
 return rows.map((r,i)=>{
  if(r.length>3)throw Error("Row "+(i+1)+" has more than three syllabus columns.");
  return {subject:r[0]||"",chapter:r[1]||"",topic:r[2]||""};
 });
}
function outlineRows(text){
 return text.split(/\r?\n/).filter(line=>line.trim()).map(line=>{
  const values=line.split(/\s*>\s*/).map(x=>x.trim());
  if(values.length>3)throw Error("Each outline line must have Subject > Chapter > Topic.");
  return {subject:values[0]||"",chapter:values[1]||"",topic:values[2]||""};
 });
}
function inspect(rows){
 const already=new Set(nodes.filter(n=>n.state!=="archived").map(n=>normalize(pathOf(n))));
 const seen=new Set();
 return rows.map((row,index)=>{
  const fields={};
  for(const k of ["subject","chapter","topic"])
   fields[k]=String(row[k]||"").normalize("NFKC").trim().replace(/\s+/g," ");
  const errors=[];
  if(!fields.subject||Object.values(fields).some(x=>x.length>160)||fields.topic&&!fields.chapter)
   errors.push("Missing required subject/chapter or oversized label.");
  if(Object.values(fields).some(x=>/[\u0000-\u001f\u007f]/.test(x)))
   errors.push("Control characters are not allowed.");
  const path=[fields.subject,fields.chapter,fields.topic].filter(Boolean).join(" → ");
  const normalized=normalize(path);
  const duplicate=seen.has(normalized)||already.has(normalized);
  seen.add(normalized);
  return {line:index+1,fields,errors,duplicate,status:errors.length?"invalid":duplicate?"existing/duplicate":"new draft"};
 });
}
function renderPreview(){
 const body=$("syllabus-preview-rows");body.replaceChildren();
 const counts=preview.reduce((p,r)=>{p[r.status]=(p[r.status]||0)+1;return p;},{});
 for(const row of preview.slice(0,400)){
  const tr=document.createElement("tr");
  for(const v of [row.status,row.fields.subject,row.fields.chapter,row.fields.topic]){
   const td=document.createElement("td");td.textContent=v;tr.append(td);
  }
  body.append(tr);
 }
 $("syllabus-import").disabled=busy||!preview.length||preview.some(x=>x.errors.length);
 importStatus("Reviewed "+preview.length+" syllabus rows · "+(counts["new draft"]||0)+
  " proposed new paths · "+(counts["existing/duplicate"]||0)+" existing/repeated. "+
  "Only draft syllabus nodes will be saved; no student MCQs will change.");
}
$("syllabus-template").addEventListener("click",()=>{
 const template='"subject","chapter","topic"\r\n"Biology","Biological Molecules","Carbohydrates"\r\n"Biology","Biological Molecules","Proteins"\r\n"Physics","Waves","Sound"\r\n';
 const url=window.URL.createObjectURL(new Blob([template],{type:"text/csv"}));
 const a=document.createElement("a");a.href=url;a.download="sjn-mednest-master-syllabus-template.csv";
 document.body.append(a);a.click();a.remove();window.URL.revokeObjectURL(url);
});
$("syllabus-preview").addEventListener("click",async()=>{
 try{
  let rows;
  const file=$("syllabus-file").files?.[0],text=$("syllabus-paste").value;
  if(file&&text.trim())throw Error("Choose either a file or pasted outline—not both.");
  if(file){
   if(file.size>20_000_000)throw Error("File too large (20 MB maximum).");
   if(/\.xlsx$/i.test(file.name)){
    const excel=window.MedNestXLSX;
    if(!excel)throw Error("Excel reader is not ready.");
    const sheet=await excel.readXLSX(await file.arrayBuffer());
    rows=csvRows(excel.toCSV(sheet.rows));
   }else if(/\.csv$/i.test(file.name))rows=csvRows(await file.text());
   else throw Error("Use a CSV or XLSX syllabus file.");
  }else rows=outlineRows(text);
  if(!rows.length||rows.length>10000)throw Error("Provide 1–10,000 syllabus rows.");
  preview=inspect(rows);renderPreview();
 }catch(e){preview=[];$("syllabus-import").disabled=true;importStatus(e.message,true)}
});
// Any change to the source invalidates a previously validated preview.
for(const id of ["syllabus-file","syllabus-paste"]){
 $(id).addEventListener(id==="syllabus-file"?"change":"input",()=>{
  preview=[];$("syllabus-import").disabled=true;
  importStatus("Syllabus input changed. Preview the new contents before saving.");
 });
}
$("syllabus-import").addEventListener("click",async()=>{
 if(busy||!preview.length||preview.some(x=>x.errors.length))return;
 if(!window.confirm("Stage "+preview.length+" syllabus paths as DRAFT? Student MCQs will not be altered."))return;
 mutationBusy(true);
 try{
  let done=0,created=0;
  for(let i=0;i<preview.length;i+=100){
   const chunk=preview.slice(i,i+100).map(x=>x.fields);
   const result=await call("syllabus.stage",{rows:chunk});
   done+=chunk.length;created+=result.result?.created_nodes||0;
   importStatus("Staged "+done+" of "+preview.length+" rows...");
  }
  await loadAll();preview=[];$("syllabus-import").disabled=true;
  importStatus("Syllabus staged successfully. "+created+" new draft nodes created. Review subjects before approval. No student MCQs modified.");
 }catch(e){importStatus("Import interrupted; already confirmed chunks remain staged. Re-preview and retry safely. "+e.message,true)}
 finally{mutationBusy(false)}
});
window.addEventListener("mednest:module",event=>{
 if(event.detail?.key==="syllabus"||event.detail?.key==="questions")
  loadAll().catch(e=>status(e.message,true));
});
window.addEventListener("mednest:signed-out",()=>{
 nodes=[];selected=null;preview=[];loaded=false;
 $("syllabus-paste").value="";$("syllabus-file").value="";
 $("syllabus-name").value="";renderTree();dispatch();
});
renderParents();renderTree();dispatch();
