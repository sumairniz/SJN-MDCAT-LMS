// SJN MedNest Chief-only MCQ Library. Saves proposals, NEVER publishes student edits.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL="https://tdqbjhrmfluiinntmjfh.supabase.co";
const KEY="sb_publishable_Redb-pOjNOSpDKg1uIbUBg_-PUCt5XX";
const API=URL+"/functions/v1/mednest-mcq-library";
const auth=createClient(URL,KEY,{auth:{
 persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,
 storageKey:"sjn-mednest-isolated-staff-v1"
}});
const $=id=>document.getElementById(id);
const fields=["bank","subject","chapter","topic","source","question","option_a","option_b",
 "option_c","option_d","correct_option","explanation","mnemonic"];
let page=0,total=0,selection=null,pending=false,loaded=false;
const setStatus=(message,error=false,id="mcq-lib-status")=>{
 const el=$(id);if(!el)return;
 el.textContent=message;el.dataset.error=String(error);
};
function clearEditor(){
 selection=null;$("mcq-lib-editor").classList.add("is-hidden");
 for(const key of fields){const control=$("mcq-lib-edit-"+key);if(control)control.value="";}
 $("mcq-lib-syllabus-topic").replaceChildren(new Option("Not yet mapped — preserve existing classification",""));
 setStatus("No MCQ editing session open.",false,"mcq-lib-editor-status");
}
function busy(active){
 pending=active;
 for(const id of ["mcq-lib-refresh","mcq-lib-search-button","mcq-lib-prev","mcq-lib-next","mcq-lib-save"])
  $(id).disabled=active;
}
async function call(action,args={}){
 const {data:{session},error}=await auth.auth.getSession();
 if(error||!session?.access_token)throw Error("Sign in with your verified Chief Administrator management account.");
 const resp=await fetch(API,{
  method:"POST",cache:"no-store",credentials:"omit",
  headers:{"content-type":"application/json","apikey":KEY,
    authorization:"Bearer "+session.access_token},
  body:JSON.stringify({action,...args})
 });
 const data=await resp.json().catch(()=>({}));
 if(!resp.ok)throw Error(data.error||"MCQ Library request failed.");
 return data;
}
function filters(){
 return {q:$("mcq-lib-search").value.trim(),bank:$("mcq-lib-bank").value,
  subject:$("mcq-lib-subject").value,page};
}
function cell(text){
 const td=document.createElement("td");td.textContent=String(text??"");return td;
}
function drawRows(rows){
 const body=$("mcq-lib-results");body.replaceChildren();
 if(!rows.length){
  const tr=document.createElement("tr");const td=cell("No MCQs match the selected filters.");
  td.colSpan=5;tr.append(td);body.append(tr);return;
 }
 for(const mcq of rows){
  const tr=document.createElement("tr");
  tr.append(cell("#"+mcq.id),cell(mcq.bank),cell(mcq.subject+" / "+(mcq.chapter||"Unclassified")),
   cell(mcq.question.slice(0,180)+(mcq.question.length>180?"…":"")));
  const td=document.createElement("td"),open=document.createElement("button");
  open.type="button";open.className="studio-edit";open.textContent="Open & Edit";
  open.addEventListener("click",()=>openQuestion(mcq.id));
  td.append(open);tr.append(td);body.append(tr);
 }
}
async function search(){
 if(pending)return;
 busy(true);
 try{
  const result=await call("mcqs.list",filters());
  total=result.total||0;page=result.page||0;loaded=true;
  drawRows(result.questions||[]);
  $("mcq-lib-paging").textContent="Page "+(page+1)+" / "+Math.max(1,Math.ceil(total/25))+
    " · "+total+" matching MCQs";
  setStatus("Read-only MCQ catalogue loaded. Student answers and Test History are unchanged.");
 }catch(e){
  setStatus(e.message,true);
 }finally{
  busy(false);
  $("mcq-lib-prev").disabled=page<=0||pending;
  $("mcq-lib-next").disabled=(page+1)*25>=total||pending;
 }
}
function proposedFields(){
 return Object.fromEntries(fields.map(k=>[k,$("mcq-lib-edit-"+k).value]));
}
function showFields(data){
 for(const key of fields)$("mcq-lib-edit-"+key).value=data[key]??"";
}
function activeSyllabus(){
 const chooser=$("mcq-lib-syllabus-topic"),previous=chooser.value;
 chooser.replaceChildren(new Option("Not yet mapped — preserve existing classification",""));
 for(const item of window.MedNestSyllabus?.getActiveTopics?.()||[])
  chooser.append(new Option(item.subject+" → "+item.chapter+" → "+item.topic,item.id));
 if([...chooser.options].some(x=>x.value===previous))chooser.value=previous;
}
async function openQuestion(mcqId){
 if(pending)return;
 busy(true);
 try{
  const result=await call("mcqs.get",{mcq_id:mcqId});
  const {source,draft,source_changed}=result;
  if(!source?.revision_id||!source.fields)throw Error("Question source revision unavailable");
  selection={mcqId,revision:source.revision_id,original:source.fields,
    draftVersion:draft?.state==="draft"?draft.version:0,sourceChanged:source_changed};
  activeSyllabus();
  showFields(draft?.state==="draft"?draft.edited_fields:source.fields);
  if(draft?.syllabus_topic_id)$("mcq-lib-syllabus-topic").value=draft.syllabus_topic_id;
  $("mcq-lib-editor-title").textContent="Edit MCQ #"+mcqId;
  $("mcq-lib-source").textContent="Published source: "+source.bank+
   " · Current revision ID: "+source.revision_id+
   " · Proposed changes are unpublished and saved in Management Auth.";
  $("mcq-lib-editor").classList.remove("is-hidden");
  $("mcq-lib-editor").scrollIntoView({behavior:"smooth",block:"nearest"});
  if(source_changed)
   setStatus("WARNING: The published revision changed after the existing draft was created. Save is blocked until the draft is reconciled.",true,"mcq-lib-editor-status");
  else
   setStatus(draft?"Loaded your previous unpublished correction draft.":"Original published MCQ loaded; changes are not saved until you choose Save Draft.",
    false,"mcq-lib-editor-status");
 }catch(e){
  setStatus(e.message,true);
 }finally{busy(false)}
}
$("mcq-lib-syllabus-topic").addEventListener("change",event=>{
 const id=event.target.value;
 if(!id)return;
 const match=(window.MedNestSyllabus?.getActiveTopics?.()||[]).find(t=>t.id===id);
 if(!match){event.target.value="";return;}
 $("mcq-lib-edit-subject").value=match.subject;
 $("mcq-lib-edit-chapter").value=match.chapter;
 $("mcq-lib-edit-topic").value=match.topic;
 setStatus("Approved syllabus path selected. Original question and historical results remain unchanged.",
  false,"mcq-lib-editor-status");
});
$("mcq-lib-edit-form").addEventListener("submit",async event=>{
 event.preventDefault();
 if(!selection||pending)return;
 if(selection.sourceChanged){
  setStatus("Source revision conflict: do not overwrite. Refresh the MCQ before editing again.",true,"mcq-lib-editor-status");return;
 }
 const fieldsData=proposedFields();
 if(fieldsData.bank!==selection.original.bank||!["A","B","C","D"].includes(fieldsData.correct_option)){
  setStatus("Invalid bank or answer key. Choose the original bank and one answer A–D.",true,"mcq-lib-editor-status");return;
 }
 if(!window.confirm("Save an UNPUBLISHED correction draft for MCQ #"+selection.mcqId+
   "? The current student question and historical results will not change."))return;
 busy(true);
 try{
  const result=await call("mcqs.save_draft",{
   mcq_id:selection.mcqId,expected_revision_id:selection.revision,
   expected_version:selection.draftVersion,fields:fieldsData,
   syllabus_topic_id:$("mcq-lib-syllabus-topic").value||null
  });
  selection.draftVersion=result.draft?.version??selection.draftVersion;
  setStatus("Protected correction draft saved (version "+selection.draftVersion+
   "). Not published to students. Academic review and release required.",false,"mcq-lib-editor-status");
 }catch(e){setStatus(e.message,true,"mcq-lib-editor-status")}
 finally{busy(false)}
});
$("mcq-lib-close").addEventListener("click",clearEditor);
$("mcq-lib-reset").addEventListener("click",()=>{
 if(!selection)return;
 if(!window.confirm("Reset the form to the currently published question? Existing server-side draft remains unchanged until saved."))return;
 showFields(selection.original);$("mcq-lib-syllabus-topic").value="";
 setStatus("Form restored to the published source. No server-side draft has been overwritten.",false,"mcq-lib-editor-status");
});
$("mcq-lib-search-button").addEventListener("click",()=>{page=0;search()});
$("mcq-lib-search").addEventListener("keydown",e=>{
 if(e.key==="Enter"){e.preventDefault();page=0;search()}
});
for(const id of ["mcq-lib-bank","mcq-lib-subject"])
 $(id).addEventListener("change",()=>{page=0;search()});
$("mcq-lib-refresh").addEventListener("click",search);
$("mcq-lib-prev").addEventListener("click",()=>{if(page>0){page--;search()}});
$("mcq-lib-next").addEventListener("click",()=>{if((page+1)*25<total){page++;search()}});
window.addEventListener("mednest:syllabus-updated",activeSyllabus);
window.addEventListener("mednest:module",e=>{
 if(e.detail?.key==="questions"&&!loaded)search();
});
window.addEventListener("mednest:signed-out",()=>{
 page=0;total=0;loaded=false;selection=null;
 $("mcq-lib-search").value="";$("mcq-lib-results").replaceChildren();
 $("mcq-lib-paging").textContent="—";clearEditor();
 setStatus("Signed out. Search results and unsaved edits cleared.");
});
clearEditor();
