// SJN MedNest Academic Review API. Management Auth ONLY, student publishing absent.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const EXPECTED="https://tdqbjhrmfluiinntmjfh.supabase.co";
const ALLOWED_ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+|-git-sjn-phase1a-foundation)-sjn1\.vercel\.app$/;
const OPS=new Set(["review.policy","review.set_policy","review.drafts","review.submit","review.queue","review.detail","review.decide","review.withdraw"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId=v=>typeof v==="string"&&UUID.test(v);
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
function response(origin,status,value){return new Response(JSON.stringify(value),{status,headers:{
 "content-type":"application/json","vary":"Origin","cache-control":"no-store,private",
 "x-content-type-options":"nosniff","access-control-allow-origin":origin||"null"
}})}
function claims(token){try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}
const deny=(origin,error="Review action unavailable")=>response(origin,403,{error});
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!ALLOWED_ORIGIN.test(origin))return deny("");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS",
  "access-control-allow-headers":"authorization,apikey,content-type","vary":"Origin"
 }});
 if(req.method!=="POST")return response(origin,405,{error:"Method not supported"});
 if(URL!==EXPECTED||!SERVICE)return response(origin,503,{error:"Management Auth review service unavailable"});
 let body;
 try{const raw=await req.text();if(raw.length>10000)throw Error();
  body=JSON.parse(raw);if(!body||!OPS.has(body.action))throw Error();
 }catch{return response(origin,400,{error:"Invalid academic review request"})}
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [a-zA-Z0-9._-]+$/.test(bearer))return response(origin,401,{error:"Management login required"});
 const token=bearer.slice(7),jwt=claims(token);
 if(!jwt||jwt.iss!==EXPECTED+"/auth/v1"||jwt.aud!=="authenticated"||!isId(jwt.session_id))
  return response(origin,401,{error:"Invalid Management Auth session"});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user?.email_confirmed_at||user.id!==jwt.sub)
  return response(origin,401,{error:"Verified staff login required"});
 const {data:live,error:liveErr}=await db.rpc("mednest_staff_session_live",{
  p_user_id:user.id,p_session_id:jwt.session_id
 });
 if(liveErr||!live)return response(origin,401,{error:"Staff session expired"});
 const {data:staff,error:memberErr}=await db.from("mednest_staff_members")
  .select("technical_role,status,email,permissions").eq("user_id",user.id).maybeSingle();
 if(memberErr||!staff||staff.status!=="active"||
  staff.email!==(user.email||"").trim().toLowerCase())return deny(origin);
 const chief=staff.technical_role==="chief_admin";
 const editor=chief||staff.permissions?.includes("content.edit");
 const reviewer=chief||staff.permissions?.includes("content.review");
 // Staff membership invites are still hard-disabled. Non-Chief review capabilities
 // may be used only after independent staff onboarding, approval and testing.
 if(body.action==="review.policy"){
  if(!editor&&!reviewer)return deny(origin);
  const {data,error}=await db.from("mednest_academic_review_policies")
   .select("scope,review_mode,version,updated_at").eq("scope","mcq_correction").single();
  if(error)return response(origin,503,{error:"Review policy unavailable"});
  return response(origin,200,{policy:data,publishing_enabled:false});
 }
 if(body.action==="review.set_policy"){
  if(!chief)return deny(origin,"Chief Administrator only");
  if(!["direct","one","two"].includes(body.mode)||!Number.isInteger(body.expected_version)||
     body.expected_version<1)return response(origin,400,{error:"Invalid policy selection"});
  const {data,error}=await db.rpc("mednest_academic_review_set_policy",{
   p_actor:user.id,p_session:jwt.session_id,p_mode:body.mode,
   p_expected_version:body.expected_version
  });
  if(error)return deny(origin,"Chief email security authorization or policy version required");
  return response(origin,200,{policy:data,publishing_enabled:false});
 }
 if(body.action==="review.drafts"){
  if(!editor)return deny(origin);
  const {data,error}=await db.from("mednest_mcq_edit_drafts")
   .select("id,source_mcq_id,source_bank,original_revision_id,version,state,updated_at")
   .eq("owner_user_id",user.id).eq("state","draft")
   .order("updated_at",{ascending:false}).limit(100);
  if(error)return response(origin,503,{error:"Draft list unavailable"});
  return response(origin,200,{drafts:data||[],publishing_enabled:false});
 }
 if(body.action==="review.submit"){
  if(!editor)return deny(origin);
  if(!isId(body.draft_id)||!Number.isInteger(body.expected_version)||
    body.expected_version<1)return response(origin,400,{error:"Invalid review submission"});
  const {data,error}=await db.rpc("mednest_academic_review_submit",{
   p_actor:user.id,p_session:jwt.session_id,
   p_draft:body.draft_id,p_expected_version:body.expected_version
  });
  if(error)return response(origin,409,{error:"Draft version conflict or review already open"});
  return response(origin,200,{submission:data,publishing_enabled:false});
 }
 if(body.action==="review.queue"){
  if(!reviewer&&!editor)return deny(origin);
  const state=body.state||"pending";
  if(!["pending","needs_changes","approved_for_release","withdrawn"].includes(state))
   return response(origin,400,{error:"Unknown review status"});
  let query=db.from("mednest_academic_review_submissions")
   .select("id,draft_id,author_user_id,source_mcq_id,source_bank,source_revision_id,submitted_draft_version,policy_mode,required_reviewers,state,review_1_user_id,review_2_user_id,created_at,updated_at");
  if(!reviewer)query=query.eq("author_user_id",user.id);
  const {data,error}=await query.eq("state",state)
   .order("created_at",{ascending:false}).limit(100);
  if(error)return response(origin,503,{error:"Review queue temporarily unavailable"});
  return response(origin,200,{submissions:data||[],publishing_enabled:false});
 }
 if(body.action==="review.detail"){
  if(!reviewer&&!editor)return deny(origin);
  if(!isId(body.submission_id))return response(origin,400,{error:"Invalid review identifier"});
  const {data,error}=await db.from("mednest_academic_review_submissions")
   .select("id,author_user_id,source_mcq_id,source_bank,source_revision_id,submitted_draft_version,submitted_fields,syllabus_topic_id,policy_mode,required_reviewers,state,review_1_user_id,review_2_user_id,rejection_reason,created_at,updated_at")
   .eq("id",body.submission_id).maybeSingle();
  if(error)return response(origin,503,{error:"Review details unavailable"});
  if(!data||(!reviewer&&data.author_user_id!==user.id))return deny(origin);
  return response(origin,200,{submission:data,publishing_enabled:false});
 }
 if(body.action==="review.decide"){
  if(!reviewer)return deny(origin);
  if(!isId(body.submission_id)||!["approve","request_changes"].includes(body.decision)||
   typeof(body.reason??"")!=="string"||(body.reason||"").length>1000)
   return response(origin,400,{error:"Invalid review decision"});
  const {data,error}=await db.rpc("mednest_academic_review_decide",{
   p_actor:user.id,p_session:jwt.session_id,p_submission:body.submission_id,
   p_decision:body.decision,p_reason:body.reason||""
  });
  if(error)return response(origin,409,{error:"Independent reviewer or pending review required"});
  return response(origin,200,{decision:data,publishing_enabled:false});
 }
 if(body.action==="review.withdraw"){
  if(!editor)return deny(origin);
  if(!isId(body.submission_id))return response(origin,400,{error:"Invalid submission"});
  const {data,error}=await db.rpc("mednest_academic_review_withdraw",{
   p_actor:user.id,p_session:jwt.session_id,p_submission:body.submission_id
  });
  if(error)return response(origin,409,{error:"Only the author may withdraw a pending review"});
  return response(origin,200,{submission:data,publishing_enabled:false});
 }
 return deny(origin);
});