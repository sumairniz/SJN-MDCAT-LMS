// SJN MedNest Content Studio server-draft transport.
// Independent staff Auth ONLY; no student Supabase URL, keys, or publishing actions.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL="https://tdqbjhrmfluiinntmjfh.supabase.co";
const KEY="sb_publishable_Redb-pOjNOSpDKg1uIbUBg_-PUCt5XX";
const API=URL+"/functions/v1/mednest-content-studio";
const STUDENT_URL="https://aozknkrwafowsrehdwlr.supabase.co";
const STUDENT_KEY="sb_publishable_9CjKnd4hEIIvS7OXvTq_aA_tTkLsBts";
const PUBLISH_API=STUDENT_URL+"/functions/v1/mednest-content-publish";
const client=createClient(URL,KEY,{auth:{
 autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,
 storageKey:"sjn-mednest-isolated-staff-v1"
}});
const uuid=()=>crypto.randomUUID();
async function call(action,props={}){
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session?.access_token)throw Error("Sign in as Chief Administrator before saving drafts.");
 const reply=await fetch(API,{method:"POST",credentials:"omit",cache:"no-store",
  headers:{"content-type":"application/json","apikey":KEY,
   authorization:"Bearer "+session.access_token},
  body:JSON.stringify({action,...props})
 });
 const data=await reply.json().catch(()=>({}));
 if(!reply.ok){
  const issues=Array.isArray(data.issues)?data.issues.slice(0,8).map(x=>String(x).slice(0,200)):[];
  throw Error((data.error||"Protected draft storage temporarily unavailable.")+
   (issues.length?" — "+issues.join(" | "):""));
 }
 return data;
}
async function save({batchId,clientKey,title,items,onProgress}){
 if(!items.length)throw Error("Create or import drafts before saving.");
 if(items.length>3000)throw Error("Save up to 3,000 rows per batch. Split larger CSV imports.");
 if(items.some(x=>!Number.isInteger(x.line)||x.line<1||x.line>3000))
  throw Error("Draft row positions must fit within 1–3,000; start a new batch.");
 const idempotencyKey=clientKey||uuid();
 let id=batchId;
 if(!id){
  const result=await call("batch.create",{client_key:idempotencyKey,title});
  id=result.batch?.id;
  if(!id)throw Error("Failed to reserve a draft batch.");
 }
 let saved=0;
 for(let i=0;i<items.length;i+=40){
  const chunk=items.slice(i,i+40).map(x=>({position:x.line,fields:x.entry}));
  const r=await call("batch.save_rows",{batch_id:id,rows:chunk});
  if(r.saved!==chunk.length)throw Error("Server did not acknowledge a full draft chunk.");
  saved+=r.saved;
  onProgress?.(saved,items.length);
 }
 return {batchId:id,clientKey:idempotencyKey,saved};
}
async function load(batchId){
 let rows=[],start=1;
 for(let attempt=0;attempt<31;attempt++){
  const result=await call("batch.get",{batch_id:batchId,start});
  const batchRows=result.rows||[];
  rows.push(...batchRows.map(x=>({line:x.position,entry:x.fields})));
  if(rows.length>3000)throw Error("Saved batch exceeds the supported size.");
  if(!result.has_more||!batchRows.length)return {rows,batch:result.batch};
  start=batchRows[batchRows.length-1].position+1;
  if(start>3000)return {rows,batch:result.batch};
 }
 throw Error("Draft batch could not be fully loaded; no local changes applied.");
}

async function publishBatch(batchId,{onProgress,expectedCount}={}){
 if(!/^[0-9a-f-]{36}$/i.test(batchId||""))throw Error("Open an approved saved batch before publishing.");
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session?.access_token)throw Error("Sign in with your verified Management Auth account.");
 let start=1,published=0,chunks=0;const receipts=[];
 for(let attempt=0;attempt<76;attempt++){
  const response=await fetch(PUBLISH_API,{method:"POST",credentials:"omit",cache:"no-store",
   headers:{"content-type":"application/json","apikey":STUDENT_KEY,"authorization":"Bearer "+session.access_token},
   body:JSON.stringify({action:"batch.publish_chunk",batch_id:batchId,start})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error((data.error||"Student LMS Staging publication failed.")+
    " Published "+published+" of "+(expectedCount||"the batch")+" questions before this response. You can safely retry the same approved batch; completed chunks are idempotent.");
  if(!Number.isInteger(data.published_count)||!Array.isArray(data.items))throw Error("Student LMS returned an invalid publication receipt.");
  published+=data.published_count;chunks++;receipts.push(...data.items);
  onProgress?.(published,expectedCount||null,chunks);
  if(!data.has_more) return {batchId,published,chunks,receipts};
  if(!Number.isInteger(data.next_start)||data.next_start<=start||data.next_start>3000)throw Error("Invalid next-chunk cursor; completed chunks remain safely recorded.");
  start=data.next_start;
 }
 throw Error("Batch exceeded the safe chunk limit. Published "+published+" questions; retry after inspecting the release receipts.");
}

window.MedNestStudioStorage=Object.freeze({
 list:()=>call("batch.list"),save,load,publishBatch,
 submitReview:batchId=>call("batch.submit_review",{batch_id:batchId}),
 prepareDirect:batchId=>call("batch.prepare_direct",{batch_id:batchId}),
 withdrawReview:batchId=>call("batch.withdraw_review",{batch_id:batchId}),
 reviewDecision:(batchId,decision,reason)=>call("batch.review_decide",{batch_id:batchId,decision,reason})
});
