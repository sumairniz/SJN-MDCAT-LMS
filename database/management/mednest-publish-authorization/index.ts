// SJN MedNest — Management Auth publisher authorization/payload endpoint.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL=Deno.env.get("SUPABASE_URL")||"", SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const EXPECTED="https://tdqbjhrmfluiinntmjfh.supabase.co";
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9-]+)?(?:-sjn1)?\.vercel\.app$/;
const uuid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const reply=(origin,status,data)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store,private","x-content-type-options":"nosniff","access-control-allow-origin":origin||"null","vary":"Origin"}});
function validFields(f){
 return f&&typeof f==="object"&&!Array.isArray(f)&&
  ["SJN Question Bank","Past Papers Question Bank"].includes(f.bank)&&
  ["Biology","Chemistry","Physics","English","Logical Reasoning"].includes(f.subject)&&
  typeof f.question==="string"&&f.question.trim()&&
  ["option_a","option_b","option_c","option_d"].every(k=>typeof f[k]==="string"&&f[k].trim())&&
  ["A","B","C","D"].includes(String(f.correct_option||"").toUpperCase())&&!(f.option_e||"").trim();
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(origin&&!ORIGIN.test(origin))return reply("",403,{error:"Origin denied"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"authorization,apikey,content-type","vary":"Origin"}});
 if(req.method!=="POST")return reply(origin,405,{error:"Method denied"});
 if(URL!==EXPECTED||!SERVICE)return reply(origin,503,{error:"Management authorization service unavailable"});
 let body;
 try{const raw=await req.text();if(raw.length>5000)throw Error();body=JSON.parse(raw);
  if(body?.action==="batch.publish_chunk"){
   if(!uuid(body.batch_id)||!Number.isInteger(body.start)||body.start<1||body.start>3000||body.limit!==40)throw Error();
  }else if(body?.action==="edit.publish"){
   if(!uuid(body.submission_id))throw Error();
  }else throw Error();
 }catch{return reply(origin,400,{error:"Invalid publishing authorization request"});}
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [a-zA-Z0-9._-]+$/.test(bearer))return reply(origin,401,{error:"Management login required"});
 const token=bearer.slice(7),{data:{user},error:userError}=await db.auth.getUser(token);
 if(userError||!user?.email_confirmed_at)return reply(origin,401,{error:"Verified Management Auth account required"});
 let claims;try{claims=JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return reply(origin,401,{error:"Invalid Management Auth token"});}
 if(claims.iss!==EXPECTED+"/auth/v1"||claims.aud!=="authenticated"||claims.sub!==user.id||!uuid(claims.session_id))
  return reply(origin,401,{error:"Invalid Management Auth session"});
 const {data:live,error:sessionError}=await db.rpc("mednest_staff_session_live",{p_user_id:user.id,p_session_id:claims.session_id});
 if(sessionError||!live)return reply(origin,401,{error:"Management session expired"});
 const {data:actor,error:actorError}=await db.from("mednest_staff_members").select("email,technical_role,status,permissions").eq("user_id",user.id).maybeSingle();
 if(actorError||!actor||actor.status!=="active"||actor.email!==(user.email||"").trim().toLowerCase())return reply(origin,403,{error:"Active Management staff membership required"});
 if(actor.technical_role!=="chief_admin"&&!((actor.permissions||[]).includes("content.publish")))return reply(origin,403,{error:"Content publishing permission required"});

 if(body.action==="batch.publish_chunk"){
  const {data:batch,error:be}=await db.from("mednest_content_draft_batches").select("id,title,status").eq("id",body.batch_id).maybeSingle();
  if(be)return reply(origin,503,{error:"Approved draft lookup unavailable"});
  if(!batch||batch.status!=="approved_for_release")return reply(origin,409,{error:"Only batches approved for release can be published"});
  const {data:rows,error:re}=await db.from("mednest_content_draft_rows").select("position,fields,content_hash")
   .eq("batch_id",batch.id).gte("position",body.start).order("position",{ascending:true}).limit(41);
  if(re)return reply(origin,503,{error:"Approved draft rows unavailable"});
  const page=(rows||[]).slice(0,40);
  if(!page.length)return reply(origin,404,{error:"No approved questions found at this batch position"});
  if(page.some(row=>!validFields(row.fields)))return reply(origin,422,{error:"Approved batch contains unsupported or invalid Student LMS content"});
  return reply(origin,200,{actor_user_id:user.id,session_id:claims.session_id,batch_id:batch.id,batch_title:batch.title,
   status:batch.status,start:body.start,items:page,has_more:(rows||[]).length>40,next_start:page[page.length-1].position+1});
 }

 const {data:submission,error:se}=await db.from("mednest_academic_review_submissions")
  .select("id,draft_id,author_user_id,source_mcq_id,source_bank,source_revision_id,submitted_draft_version,submitted_fields,state")
  .eq("id",body.submission_id).maybeSingle();
 if(se)return reply(origin,503,{error:"Approved correction lookup unavailable"});
 if(!submission||submission.state!=="approved_for_release")return reply(origin,409,{error:"Only an approved MCQ correction can be published"});
 if(!["SJN Question Bank","Past Papers Question Bank"].includes(submission.source_bank))
  return reply(origin,422,{error:"Restricted or unsupported MCQ bank cannot be published"});
 const {data:draft,error:de}=await db.from("mednest_mcq_edit_drafts")
  .select("id,owner_user_id,source_mcq_id,source_bank,original_revision_id,edited_fields,version,state")
  .eq("id",submission.draft_id).maybeSingle();
 if(de)return reply(origin,503,{error:"Correction draft verification unavailable"});
 if(!draft||draft.owner_user_id!==submission.author_user_id||draft.state!=="draft"||
  draft.source_mcq_id!==submission.source_mcq_id||draft.source_bank!==submission.source_bank||
  draft.original_revision_id!==submission.source_revision_id||draft.version!==submission.submitted_draft_version||
  JSON.stringify(draft.edited_fields)!==JSON.stringify(submission.submitted_fields)||!validFields(submission.submitted_fields))
  return reply(origin,409,{error:"Approved correction no longer matches its frozen draft version or source revision"});
 return reply(origin,200,{actor_user_id:user.id,submission_id:submission.id,mcq_id:submission.source_mcq_id,
  expected_revision_id:submission.source_revision_id,fields:submission.submitted_fields,mode:"edit"});
});
