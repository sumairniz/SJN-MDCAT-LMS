// SJN MedNest Content Studio API — isolated unpublished drafts ONLY.
// Runs on the independent Management Auth Supabase project, never student LMS.
// Chief-verified, currently no staff write access and NO publish action.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const EXPECTED="https://tdqbjhrmfluiinntmjfh.supabase.co";
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+|-git-sjn-phase1a-foundation)-sjn1\.vercel\.app$/;
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
const ALLOWED=new Set(["batch.create","batch.list","batch.get","batch.save_rows","batch.submit_review","batch.prepare_direct","batch.withdraw_review","batch.review_decide"]);
const COLUMNS=["bank","subject","chapter","topic","question","option_a","option_b","option_c","option_d","option_e","correct_option","explanation","mnemonic","source","region","year","paper_code"];
const TEXT_LIMITS={bank:80,subject:80,chapter:160,topic:160,question:6000,option_a:6000,option_b:6000,option_c:6000,option_d:6000,option_e:6000,correct_option:8,explanation:6000,mnemonic:2000,source:200,region:50,year:8,paper_code:100};
const reply=(origin,status,data)=>new Response(JSON.stringify(data),{status,headers:{
 "content-type":"application/json","access-control-allow-origin":origin||"null",
 "vary":"Origin","cache-control":"no-store, private","x-content-type-options":"nosniff"
}});
function claims(token){try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}
const uuid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
function normalizeFields(value){
 if(!value||Array.isArray(value)||typeof value!=="object"||Object.keys(value).some(k=>!COLUMNS.includes(k)))
  return null;
 const out={};
 for(const k of COLUMNS){
  const v=value[k]??"";
  if(typeof v!=="string"||v.length>TEXT_LIMITS[k]||v.includes("\u0000"))return null;
  out[k]=v;
 }
 // Preserve source statement and answer key literally, don't auto-correct.
 return out;
}
async function sha256(value){
 const bytes=new TextEncoder().encode(JSON.stringify(value));
 return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)))
  .map(n=>n.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!ORIGIN.test(origin))return reply("",403,{error:"Management origin denied"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin,"access-control-allow-headers":"authorization,apikey,content-type",
  "access-control-allow-methods":"POST,OPTIONS","vary":"Origin","cache-control":"no-store"
 }});
 if(req.method!=="POST")return reply(origin,405,{error:"Method denied"});
 if(URL!==EXPECTED||!SERVICE)return reply(origin,503,{error:"Management draft service not configured"});
 const size=Number(req.headers.get("content-length")||0);
 if(size>850000)return reply(origin,413,{error:"Save smaller chunks"});
 let body;
 try{
  const raw=await req.text();
  if(raw.length>850000)throw Error("payload");
  body=JSON.parse(raw);
  if(!body||!ALLOWED.has(body.action))throw Error("action");
 }catch{return reply(origin,400,{error:"Invalid draft request"})}
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [a-zA-Z0-9._-]+$/.test(bearer))return reply(origin,401,{error:"Sign in required"});
 const token=bearer.slice(7),j=claims(token);
 if(!j||j.iss!==EXPECTED+"/auth/v1"||j.aud!=="authenticated"||!uuid(j.session_id))
  return reply(origin,401,{error:"Invalid management session"});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user?.email_confirmed_at||user.id!==j.sub)
  return reply(origin,401,{error:"Verified management email required"});
 const {data:live,error:sessionError}=await db.rpc("mednest_staff_session_live",{
  p_user_id:user.id,p_session_id:j.session_id
 });
 if(sessionError||!live)return reply(origin,401,{error:"Management session expired"});
 const {data:actor,error:actorError}=await db.from("mednest_staff_members")
  .select("email,technical_role,status,permissions").eq("user_id",user.id).maybeSingle();
 if(actorError||!actor||actor.technical_role!=="chief_admin"||actor.status!=="active"||
  actor.email!==(user.email||"").trim().toLowerCase())
  return reply(origin,403,{error:"Chief Administrator authorization required"});
 // A future staff-permission design will replace this explicit Chief-only policy.
 // No student read/write client, service role, credential or publishing endpoint exists here.
 if(body.action==="batch.list"){
  const {data,error}=await db.from("mednest_content_draft_batches")
   .select("id,title,status,review_route,review_actor_user_id,review_action_at,created_at,updated_at,client_key")
   .eq("owner_user_id",user.id).order("updated_at",{ascending:false}).limit(30);
  if(error)return reply(origin,503,{error:"Draft list unavailable"});
  return reply(origin,200,{batches:data||[]});
 }
 if(body.action==="batch.create"){
  if(!uuid(body.client_key)||typeof body.title!=="string"||
    body.title.trim().length<1||body.title.trim().length>120)
   return reply(origin,400,{error:"Invalid draft batch name or key"});
  const {count,error:countError}=await db.from("mednest_content_draft_batches")
   .select("id",{count:"exact",head:true}).eq("owner_user_id",user.id);
  if(countError)return reply(origin,503,{error:"Draft quota temporarily unavailable"});
  const {data:existing,error:findError}=await db.from("mednest_content_draft_batches")
   .select("id,title,status").eq("owner_user_id",user.id).eq("client_key",body.client_key).maybeSingle();
  if(findError)return reply(origin,503,{error:"Draft batch lookup failed"});
  if(existing)return reply(origin,200,{batch:existing,created:false});
  if((count||0)>=60)return reply(origin,429,{error:"60 saved batches per Chief account; archive/export before creating more"});
  const {data,error}=await db.from("mednest_content_draft_batches")
   .insert({owner_user_id:user.id,client_key:body.client_key,title:body.title.trim()})
   .select("id,title,status").single();
  // A retry with same client_key must not create a duplicate.
  if(error)return reply(origin,409,{error:"Batch creation unavailable; refresh saved batches"});
  return reply(origin,200,{batch:data,created:true});
 }
 if(!uuid(body.batch_id))return reply(origin,400,{error:"Valid draft batch required"});
 const {data:batch,error:batchError}=await db.from("mednest_content_draft_batches")
  .select("id,owner_user_id,client_key,title,status,review_route,review_actor_user_id,review_action_at,review_note").eq("id",body.batch_id).maybeSingle();
 if(batchError)return reply(origin,503,{error:"Draft batch lookup unavailable"});
 if(!batch||batch.owner_user_id!==user.id)
  return reply(origin,403,{error:"Draft batch unavailable"});
 if(body.action==="batch.get"){
  const start=Number(body.start)||1;
  if(!Number.isInteger(start)||start<1||start>3000)
   return reply(origin,400,{error:"Invalid draft row offset"});
  const {data,error}=await db.from("mednest_content_draft_rows")
   .select("position,fields,content_hash,updated_at")
   .eq("batch_id",batch.id).gte("position",start).order("position",{ascending:true}).limit(100);
  if(error)return reply(origin,503,{error:"Draft rows unavailable"});
  return reply(origin,200,{batch:{id:batch.id,title:batch.title,client_key:batch.client_key,status:batch.status,review_route:batch.review_route,review_note:batch.review_note},
   rows:data||[],has_more:(data||[]).length===100});
 }

 // All lifecycle actions are Management-only. None publishes content to students.
 async function validateStoredRows(requireReleaseReady=false){
  let start=0,count=0;const errors=[];
  while(start<3000){
   const {data,error}=await db.from("mednest_content_draft_rows")
    .select("position,fields").eq("batch_id",batch.id)
    .order("position",{ascending:true}).range(start,start+99);
   if(error)throw Error("Draft rows unavailable");
   for(const row of data||[]){
    count++;
    const f=normalizeFields(row.fields);
    if(!f){errors.push("Question "+row.position+": invalid fields");continue}
    for(const key of ["bank","subject","chapter","topic","question","option_a","option_b","option_c","option_d"])
     if(!f[key]?.trim())errors.push("Question "+row.position+": "+key+" required");
    if(!["SJN Question Bank","Past Papers Question Bank"].includes(f.bank))
     errors.push("Question "+row.position+": invalid question bank");
    if(f.bank==="Past Papers Question Bank"&&!f.source?.trim())
     errors.push("Question "+row.position+": original source required");
    const opts=[f.option_a,f.option_b,f.option_c,f.option_d,f.option_e].filter(x=>x?.trim());
    if(new Set(opts.map(x=>x.normalize("NFKC").trim().toLowerCase())).size!==opts.length)
     errors.push("Question "+row.position+": repeated answer options");
    const correct=f.correct_option.trim().toUpperCase();
    if(!["A","B","C","D"].includes(correct) && !(correct==="E"&&f.option_e?.trim()))
     errors.push("Question "+row.position+": invalid correct answer");
    if(requireReleaseReady&&f.option_e?.trim())
     errors.push("Question "+row.position+": five-option questions cannot be marked ready for release until Student LMS supports Option E");
    if(!["Biology","Chemistry","Physics","English","Logical Reasoning"].includes(f.subject))
     errors.push("Question "+row.position+": unsupported subject");
    if(["English","Logical Reasoning"].includes(f.subject)&&
        f.chapter.trim().toLowerCase()!==f.topic.trim().toLowerCase())
     errors.push("Question "+row.position+": English/LR chapter and topic must match");
   }
   start+=(data||[]).length;
   if((data||[]).length<100)break;
   if(errors.length>20)break;
  }
  if(!count)errors.push("Draft has no questions");
  return {count,errors:errors.slice(0,25)};
 }
 if(body.action==="batch.submit_review"||body.action==="batch.prepare_direct"){
  if(batch.status!=="draft"&&batch.status!=="needs_changes")
   return reply(origin,409,{error:"This batch is not editable. Refresh the saved drafts."});
  const direct=body.action==="batch.prepare_direct";
  if(direct&&actor.technical_role!=="chief_admin")
   return reply(origin,403,{error:"Direct release preparation requires Chief Administrator authorization"});
  let validation;
  try{validation=await validateStoredRows(direct)}
  catch{return reply(origin,503,{error:"Server validation unavailable"})}
  if(validation.errors.length)return reply(origin,422,{error:"Correct draft questions before submission",issues:validation.errors});
  const state=direct?"approved_for_release":"pending_review";
  const {data:changed,error}=await db.from("mednest_content_draft_batches")
   .update({status:state,review_route:direct?"direct":"independent",
     review_actor_user_id:direct?user.id:null,review_action_at:direct?new Date().toISOString():null,
     review_note:"",updated_at:new Date().toISOString()})
   .eq("id",batch.id).eq("status",batch.status)
   .select("id,title,status,review_route").maybeSingle();
  if(error||!changed)return reply(origin,409,{error:"Batch state changed; refresh and retry"});
  return reply(origin,200,{batch:changed,validated_questions:validation.count,published:false,
   message:direct?"Prepared for release without independent academic review. Student publishing is still disabled.":
      "Submitted for independent academic review. Student publishing is still disabled."});
 }
 if(body.action==="batch.withdraw_review"){
  if(batch.status!=="pending_review")return reply(origin,409,{error:"Only pending reviews may be withdrawn"});
  const {data:changed,error}=await db.from("mednest_content_draft_batches")
   .update({status:"draft",review_route:"unselected",review_actor_user_id:null,
     review_action_at:new Date().toISOString(),updated_at:new Date().toISOString()})
   .eq("id",batch.id).eq("status","pending_review").select("id,status").maybeSingle();
  if(error||!changed)return reply(origin,409,{error:"Pending review already changed"});
  return reply(origin,200,{batch:changed,published:false});
 }
 if(body.action==="batch.review_decide"){
  // Independent academic review: author can never approve own submission.
  if(user.id===batch.owner_user_id)return reply(origin,403,{error:"An author cannot review their own draft"});
  if(!((actor.permissions||[]).includes("mcq.review")||actor.technical_role==="chief_admin"))
   return reply(origin,403,{error:"Academic review permission required"});
  if(batch.status!=="pending_review"||batch.review_route!=="independent")
   return reply(origin,409,{error:"This batch is not awaiting independent review"});
  const decision=body.decision,reason=typeof body.reason==="string"?body.reason.trim():"";
  if(!["approve","needs_changes"].includes(decision)||
     reason.length>1000||(decision==="needs_changes"&&reason.length<5))
   return reply(origin,400,{error:"Select a valid decision and supply a correction reason when needed"});
  if(decision==="approve"){
   let validation;
   try{validation=await validateStoredRows(true)}
   catch{return reply(origin,503,{error:"Review validation unavailable"})}
   if(validation.errors.length)
    return reply(origin,422,{error:"Batch is not yet eligible for release approval",issues:validation.errors});
  }
  const next=decision==="approve"?"approved_for_release":"needs_changes";
  const {data:changed,error}=await db.from("mednest_content_draft_batches")
   .update({status:next,review_actor_user_id:user.id,review_action_at:new Date().toISOString(),
    review_note:reason,updated_at:new Date().toISOString()})
   .eq("id",batch.id).eq("status","pending_review").select("id,status").maybeSingle();
  if(error||!changed)return reply(origin,409,{error:"Review decision conflict"});
  return reply(origin,200,{batch:changed,published:false});
 }
 if(body.action==="batch.save_rows"&&!["draft","needs_changes"].includes(batch.status))
  return reply(origin,409,{error:"Reviewed batches are locked. Withdraw pending review before editing."});
 if(!Array.isArray(body.rows)||!body.rows.length||body.rows.length>40)
  return reply(origin,400,{error:"Save 1–40 draft rows per request"});
 const seen=new Set(),rows=[];
 for(const r of body.rows){
  if(!Number.isInteger(r?.position)||r.position<1||r.position>3000||seen.has(r.position))
   return reply(origin,400,{error:"Invalid or repeated row position"});
  const fields=normalizeFields(r.fields);
  if(!fields)return reply(origin,400,{error:"Invalid draft fields; verify text lengths and column names"});
  seen.add(r.position);
  rows.push({batch_id:batch.id,position:r.position,fields,content_hash:await sha256(fields)});
 }
 const {error:saveError}=await db.from("mednest_content_draft_rows")
  .upsert(rows,{onConflict:"batch_id,position"});
 if(saveError)return reply(origin,503,{error:"Draft chunk could not be saved"});
 if(batch.status==="needs_changes"){
  // Returning a reviewer-rejected batch to draft requires an explicit saved change.
  const {error:reopenError}=await db.from("mednest_content_draft_batches")
   .update({status:"draft",review_route:"unselected",updated_at:new Date().toISOString()})
   .eq("id",batch.id).eq("status","needs_changes");
  if(reopenError)return reply(origin,200,{saved:rows.length,audit_warning:true,warning:"Saved, but batch status needs a refresh"});
 }else{
  await db.from("mednest_content_draft_batches")
   .update({updated_at:new Date().toISOString()}).eq("id",batch.id).eq("status","draft");
 }
 // Only metadata in audit; never copy statement, original options or email into audit.
 const {error:auditError}=await db.from("mednest_staff_audit").insert({
  actor_user_id:user.id,action:"content.draft_chunk_saved",
  details:{batch_id:batch.id,count:rows.length,min:Math.min(...seen),max:Math.max(...seen)}
 });
 // Storage commits even if audit unavailable; return accurate outcome, do not retry blindly.
 if(auditError)return reply(origin,200,{saved:rows.length,audit_warning:true});
 return reply(origin,200,{saved:rows.length});
});
