// SJN MedNest — Student LMS Staging-only publisher for approved batches and reviewed corrections.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL=Deno.env.get("SUPABASE_URL")||"", SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const EXPECTED="https://aozknkrwafowsrehdwlr.supabase.co";
const MGMT_AUTH="https://tdqbjhrmfluiinntmjfh.supabase.co/functions/v1/mednest-publish-authorization";
const MGMT_KEY="sb_publishable_Redb-pOjNOSpDKg1uIbUBg_-PUCt5XX";
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+|-git-sjn-phase1a-foundation)-sjn1\.vercel\.app$/;
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
const reply=(origin,status,data)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store,private","x-content-type-options":"nosniff","access-control-allow-origin":origin||"null","vary":"Origin"}});
async function digest(value){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");}
const uuidFrom=hex=>hex.slice(0,8)+"-"+hex.slice(8,12)+"-"+hex.slice(12,16)+"-"+hex.slice(16,20)+"-"+hex.slice(20,32);
async function authorize(token,payload){
 const res=await fetch(MGMT_AUTH,{method:"POST",headers:{"content-type":"application/json","apikey":MGMT_KEY,"authorization":token},
  body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw Object.assign(new Error(data.error||"Management authorization denied"),{status:res.status});
 return data;
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!ORIGIN.test(origin))return reply("",403,{error:"Management Panel origin denied"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"authorization,apikey,content-type","vary":"Origin"}});
 if(req.method!=="POST")return reply(origin,405,{error:"Method denied"});
 if(URL!==EXPECTED||!SERVICE)return reply(origin,503,{error:"Student Staging publishing service unavailable"});
 let body;try{const raw=await req.text();if(raw.length>10000)throw Error();body=JSON.parse(raw);
  if(body?.action==="batch.publish_chunk"){
   if(!/^[0-9a-f-]{36}$/i.test(body.batch_id||"")||!Number.isInteger(body.start)||body.start<1||body.start>3000)throw Error();
  }else if(body?.action==="mcq.publish_correction"){
   if(!/^[0-9a-f-]{36}$/i.test(body.submission_id||""))throw Error();
  }else throw Error();
 }catch{return reply(origin,400,{error:"Invalid publishing request"});}
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [a-zA-Z0-9._-]+$/.test(bearer))return reply(origin,401,{error:"Management sign-in required"});
 let auth;try{
  auth=body.action==="batch.publish_chunk"
   ?await authorize(bearer,{action:"batch.publish_chunk",batch_id:body.batch_id,start:body.start,limit:40})
   :await authorize(bearer,{action:"edit.publish",submission_id:body.submission_id});
 }catch(e){return reply(origin,e.status||503,{error:e.message||"Management authorization service unavailable"});}
 let actor=auth.actor_user_id,items,requestId,extra={};
 if(body.action==="batch.publish_chunk"){
  if(!actor||auth.batch_id!==body.batch_id||auth.status!=="approved_for_release"||!Array.isArray(auth.items)||!auth.items.length||auth.items.length>40)
   return reply(origin,403,{error:"Approved Management payload could not be verified"});
  items=auth.items.map(x=>({mode:"create",fields:x.fields}));
  requestId=uuidFrom(await digest("sjn-mednest-batch-publish-v1:"+auth.batch_id+":"+auth.start));
  extra={batch_id:auth.batch_id,batch_title:auth.batch_title,start:auth.start,has_more:auth.has_more,next_start:auth.next_start};
 }else{
  if(!actor||auth.submission_id!==body.submission_id||auth.mode!=="edit"||
    !Number.isSafeInteger(auth.mcq_id)||!Number.isSafeInteger(auth.expected_revision_id)||!auth.fields)
   return reply(origin,403,{error:"Approved correction payload could not be verified"});
  items=[{mode:"edit",mcq_id:auth.mcq_id,expected_revision_id:auth.expected_revision_id,fields:auth.fields}];
  requestId=uuidFrom(await digest("sjn-mednest-edit-publish-v1:"+auth.submission_id));
  extra={submission_id:auth.submission_id};
 }
 const payload=JSON.stringify({action:body.action,items});
 const payloadHash=await digest(payload);
 const {data,error}=await db.rpc("mednest_publish_mcq_batch",{p_request_id:requestId,p_actor_user_id:actor,p_payload_hash:payloadHash,p_items:items});
 if(error)return reply(origin,409,{error:"Student Staging publication failed safely. No partial transaction was committed.",request_id:requestId});
 return reply(origin,200,{...data,...extra});
});
