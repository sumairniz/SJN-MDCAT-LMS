// SJN MedNest Content Studio server-draft transport.
// Independent staff Auth ONLY; no student Supabase URL, keys, or publishing actions.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL="https://tdqbjhrmfluiinntmjfh.supabase.co";
const KEY="sb_publishable_Redb-pOjNOSpDKg1uIbUBg_-PUCt5XX";
const API=URL+"/functions/v1/mednest-content-studio";
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
 if(!reply.ok)throw Error(data.error||"Protected draft storage temporarily unavailable.");
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
window.MedNestStudioStorage=Object.freeze({
 list:()=>call("batch.list"),save,load
});
