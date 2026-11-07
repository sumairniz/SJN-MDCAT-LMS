// SJN MedNest Academic Reviews — approval workflow only. NO student publication.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL="https://tdqbjhrmfluiinntmjfh.supabase.co";
const KEY="sb_publishable_Redb-pOjNOSpDKg1uIbUBg_-PUCt5XX";
const client=createClient(URL,KEY,{auth:{
 persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,
 storageKey:"sjn-mednest-isolated-staff-v1"
}});
const ENDPOINT=URL+"/functions/v1/mednest-academic-review";
const $=id=>document.getElementById(id);
let policy=null,drafts=[],queue=[],selected=null,loading=false;
function status(message,error=false){
 const el=$("review-status");el.textContent=message;el.dataset.error=String(error);
}
function busy(flag){
 loading=flag;
 for(const id of ["review-submit","review-save-policy","review-refresh-queue",
  "review-refresh-drafts","review-refresh-policy","review-approve","review-request-changes","review-withdraw"])
  $(id).disabled=flag;
}
async function request(action,data={}){
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session?.access_token)throw Error("Please sign in to Management Auth.");
 const response=await fetch(ENDPOINT,{method:"POST",cache:"no-store",credentials:"omit",
  headers:{"content-type":"application/json","apikey":KEY,
   authorization:"Bearer "+session.access_token},
  body:JSON.stringify({action,...data})
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||"Academic review request was not accepted.");
 return result;
}
const control=(element,tag,text)=>{
 const e=document.createElement(tag);e.textContent=String(text??"");
 element.append(e);return e;
};
async function getPolicy(){
 const result=await request("review.policy");
 policy=result.policy;
 $("review-policy-mode").value=policy.review_mode;
 status("Review policy loaded: "+(policy.review_mode==="direct"?"Direct approval":
   policy.review_mode==="two"?"Two reviewers":"One independent reviewer")+
   ". Student publishing is disabled.");
}
async function getDrafts(){
 const result=await request("review.drafts");
 drafts=result.drafts||[];
 $("review-draft-count").textContent=String(drafts.length);
 const select=$("review-draft-picker"),old=select.value;
 select.replaceChildren(new Option("Select a saved unpublished correction draft",""));
 for(const d of drafts)select.append(new Option(
  "MCQ #"+d.source_mcq_id+" · "+d.source_bank+" · Draft v"+d.version,
  d.id));
 if([...select.options].some(o=>o.value===old))select.value=old;
}
function drawQueue(){
 const tbody=$("review-queue-list");tbody.replaceChildren();
 if(!queue.length){
  const tr=control(tbody,"tr",""),td=control(tr,"td","No reviews in this status.");
  td.colSpan=5;return;
 }
 for(const item of queue){
  const tr=document.createElement("tr");
  control(tr,"td","#"+item.source_mcq_id);
  control(tr,"td",item.source_bank);
  control(tr,"td",item.state.replace(/_/g," "));
  control(tr,"td",String(Number(!!item.review_1_user_id)+Number(!!item.review_2_user_id))+
   " / "+item.required_reviewers);
  const td=control(tr,"td","");
  const btn=control(td,"button","Review Details");btn.type="button";
  btn.className="studio-edit";btn.addEventListener("click",()=>openDetail(item.id));
  tbody.append(tr);
 }
}
async function getQueue(){
 const state=$("review-state").value;
 const result=await request("review.queue",{state});
 queue=result.submissions||[];
 if(state==="pending")$("review-pending-count").textContent=String(queue.length);
 if(state==="approved_for_release")$("review-approved-count").textContent=String(queue.length);
 drawQueue();
}
async function openDetail(id){
 busy(true);
 try{
  const r=await request("review.detail",{submission_id:id});
  selected=r.submission;
  const fields=$("review-detail-fields");fields.replaceChildren();
  $("review-detail-title").textContent="MCQ #"+selected.source_mcq_id+" — Academic Review";
  $("review-detail-info").textContent="Source bank: "+selected.source_bank+
   " · Published source revision: "+selected.source_revision_id+
   " · Frozen draft version: "+selected.submitted_draft_version+
   " · Policy: "+selected.policy_mode+" · Status: "+selected.state;
  for(const [key,val] of Object.entries(selected.submitted_fields||{})){
   const row=document.createElement("div");row.className="studio-field";
   control(row,"label",key.replaceAll("_"," ").replace(/\b\w/g,x=>x.toUpperCase()));
   const value=control(row,"p",val);value.className="studio-review-field";
   fields.append(row);
  }
  $("review-detail-pane").classList.remove("is-hidden");
  $("review-detail-pane").scrollIntoView({behavior:"smooth",block:"nearest"});
  const pending=selected.state==="pending";
  const own=selected.author_user_id===(await client.auth.getUser()).data.user?.id;
  $("review-approve").disabled=!pending||own;
  $("review-request-changes").disabled=!pending||own;
  $("review-withdraw").disabled=!pending||!own;
  status("Submission loaded. Self-approval is blocked; source MCQs are unchanged.");
 }catch(e){selected=null;status(e.message,true)}
 finally{busy(false)}
}
async function run(fn){
 if(loading)return;
 busy(true);
 try{await fn()}catch(e){status(e.message,true)}
 finally{busy(false)}
}
$("review-refresh-policy").addEventListener("click",()=>run(getPolicy));
$("review-refresh-drafts").addEventListener("click",()=>run(getDrafts));
$("review-refresh-queue").addEventListener("click",()=>run(getQueue));
$("review-state").addEventListener("change",()=>run(getQueue));
$("review-save-policy").addEventListener("click",()=>run(async()=>{
 if(!policy)throw Error("Refresh policy first.");
 const mode=$("review-policy-mode").value;
 if(!["direct","one","two"].includes(mode))throw Error("Choose a valid review mode.");
 if(!window.confirm("Change academic review policy to "+mode+
   "? Chief email security authorization is required. This will not publish MCQs."))return;
 const result=await request("review.set_policy",{mode,expected_version:policy.version});
 policy={...policy,review_mode:result.policy.mode,version:result.policy.version};
 status("Review policy saved. Current mode: "+policy.review_mode+
   ". Student publishing is still disabled.");
}));
$("review-submit").addEventListener("click",()=>run(async()=>{
 const id=$("review-draft-picker").value;
 const d=drafts.find(x=>x.id===id);
 if(!d)throw Error("Choose an existing correction draft.");
 if(!window.confirm("Submit MCQ #"+d.source_mcq_id+" for academic review?"+
   " The submitted version becomes frozen; no student question is published."))return;
 const result=await request("review.submit",{draft_id:d.id,expected_version:d.version});
 status("Submission "+result.submission.id+" created: "+
  result.submission.state.replaceAll("_"," ")+". Not published to students.");
 await Promise.all([getDrafts(),getQueue()]);
}));
async function decide(decision){
 await run(async()=>{
  if(!selected||selected.state!=="pending")throw Error("Open a pending review first.");
  const reason=$("review-reason").value.trim();
  if(decision==="request_changes"&&reason.length<5)throw Error("Provide at least 5 characters explaining the needed corrections.");
  if(!window.confirm((decision==="approve"?"Approve":"Request changes for")+
    " this MCQ correction? Review approval does NOT publish to students."))return;
  const r=await request("review.decide",{
   submission_id:selected.id,decision,reason
  });
  selected=null;$("review-detail-pane").classList.add("is-hidden");
  status("Review updated to "+r.decision.state.replaceAll("_"," ")+
   ". No student MCQ was published.");
  await getQueue();
 });
}
$("review-approve").addEventListener("click",()=>decide("approve"));
$("review-request-changes").addEventListener("click",()=>decide("request_changes"));
$("review-withdraw").addEventListener("click",()=>run(async()=>{
 if(!selected||selected.state!=="pending")throw Error("Open your pending submission first.");
 if(!window.confirm("Withdraw your own pending submission? This does not remove the draft."))return;
 await request("review.withdraw",{submission_id:selected.id});
 selected=null;$("review-detail-pane").classList.add("is-hidden");
 status("Your pending submission was withdrawn; historical audit was preserved.");
 await getQueue();
}));
$("review-close").addEventListener("click",()=>{
 selected=null;$("review-detail-pane").classList.add("is-hidden");
});
window.addEventListener("mednest:module",event=>{
 if(event.detail?.key==="reviews")run(async()=>{
  await getPolicy();await Promise.all([getDrafts(),getQueue()]);
 });
});
window.addEventListener("mednest:signed-out",()=>{
 policy=null;drafts=[];queue=[];selected=null;
 $("review-draft-picker").replaceChildren(new Option("Select a saved unpublished correction draft",""));
 $("review-queue-list").replaceChildren();
 $("review-detail-fields").replaceChildren();
 $("review-detail-pane").classList.add("is-hidden");
 for(const key of ["draft","pending","approved"])$("review-"+key+"-count").textContent="0";
 $("review-reason").value="";
 status("Signed out. Academic review details cleared from this browser.");
});
