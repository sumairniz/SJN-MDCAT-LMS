// SJN MedNest Academy | separate management syllabus service.
// Draft authoring/activation only. No student project API, grades or MCQ mutations.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SECRET=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const EXPECTED="https://tdqbjhrmfluiinntmjfh.supabase.co";
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+|-git-sjn-phase1a-foundation)-sjn1\.vercel\.app$/;
const db=createClient(URL,SECRET,{auth:{autoRefreshToken:false,persistSession:false}});
const OPERATIONS=new Set(["syllabus.list","syllabus.change","syllabus.stage"]);
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid=v=>typeof v==="string"&&ID.test(v);
const send=(origin,status,data)=>new Response(JSON.stringify(data),{status,headers:{
 "content-type":"application/json","cache-control":"no-store, private",
 "access-control-allow-origin":origin||"null","vary":"Origin","x-content-type-options":"nosniff"
}});
function claims(token){try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}
const validName=v=>v===undefined||v===null||(typeof v==="string"&&v.trim().length>=1&&v.trim().length<=160&&!/[\u0000-\u001f\u007f]/.test(v));
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!ORIGIN.test(origin))return send("",403,{error:"Unauthorized management origin"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS",
  "access-control-allow-headers":"authorization,apikey,content-type","vary":"Origin"
 }});
 if(req.method!=="POST")return send(origin,405,{error:"Unsupported request method"});
 if(URL!==EXPECTED||!SECRET)return send(origin,503,{error:"Independent management backend unavailable"});
 let body;try{
  const raw=await req.text();if(raw.length>46000)throw Error();
  body=JSON.parse(raw);if(!OPERATIONS.has(body?.action))throw Error();
 }catch{return send(origin,400,{error:"Invalid syllabus request"})}
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [a-zA-Z0-9._-]+$/.test(bearer))return send(origin,401,{error:"Management sign-in required"});
 const token=bearer.slice(7),j=claims(token);
 if(!j||j.iss!==EXPECTED+"/auth/v1"||j.aud!=="authenticated"||!uuid(j.session_id))
  return send(origin,401,{error:"Invalid staff authentication"});
 const {data:{user},error:ue}=await db.auth.getUser(token);
 if(ue||!user||user.id!==j.sub||!user.email_confirmed_at)
  return send(origin,401,{error:"Verified management identity required"});
 const {data:live,error:le}=await db.rpc("mednest_staff_session_live",{p_user_id:user.id,p_session_id:j.session_id});
 if(le||!live)return send(origin,401,{error:"Management session expired"});
 const {data:member,error:me}=await db.from("mednest_staff_members").select("technical_role,status,email")
  .eq("user_id",user.id).maybeSingle();
 if(me||!member||member.technical_role!=="chief_admin"||member.status!=="active"||
   member.email!==(user.email||"").toLowerCase().trim())
  return send(origin,403,{error:"Chief Administrator authorization required"});
 if(body.action==="syllabus.list"){
  const offset=body.offset===undefined?0:body.offset;
  if(!Number.isInteger(offset)||offset<0||offset>100000)
   return send(origin,400,{error:"Invalid syllabus offset"});
  const {data,error}=await db.from("mednest_syllabus_nodes")
   .select("id,parent_id,kind,name,name_key,state,revision,display_order,updated_at")
   .order("kind",{ascending:true}).order("name",{ascending:true}).range(offset,offset+199);
  if(error)return send(origin,503,{error:"Syllabus list unavailable"});
  return send(origin,200,{nodes:data||[],has_more:(data||[]).length===200,offset});
 }
 if(body.action==="syllabus.change"){
  if(!["create","rename","move","archive","restore","activate"].includes(body.operation)||
    !validName(body.name)|| (body.node_id!==undefined&&body.node_id!==null&&!uuid(body.node_id))||
    (body.parent_id!==undefined&&body.parent_id!==null&&!uuid(body.parent_id))||
    (body.operation==="create"&&!["subject","chapter","topic"].includes(body.kind)))
   return send(origin,400,{error:"Invalid syllabus modification"});
  // Atomic in-DB authorization, hierarchy validation, update and audit.
  const {data,error}=await db.rpc("mednest_syllabus_change",{
   p_actor:user.id,p_session:j.session_id,p_action:body.operation,
   p_node_id:body.node_id||null,p_kind:body.kind||null,
   p_parent_id:body.parent_id||null,p_name:body.name||null
  });
  if(error)return send(origin,409,{error:"Syllabus change rejected: invalid hierarchy, duplicate label or stale parent"});
  return send(origin,200,{result:data});
 }
 if(!Array.isArray(body.rows)||body.rows.length<1||body.rows.length>100)
  return send(origin,400,{error:"Save syllabus in chunks of 1–100 rows"});
 const rows=[];
 for(const row of body.rows){
  if(!row||typeof row!=="object"||Array.isArray(row)||
    Object.keys(row).some(k=>!["subject","chapter","topic"].includes(k)))
   return send(origin,400,{error:"Unsupported syllabus columns"});
  const clean={};
  for(const k of ["subject","chapter","topic"]){
   const value=row[k]??"";
   if(typeof value!=="string"||value.length>160||/[\u0000-\u001f\u007f]/.test(value))
    return send(origin,400,{error:"Invalid syllabus text field"});
   clean[k]=value;
  }
  if(!clean.subject.trim()||clean.topic.trim()&&!clean.chapter.trim())
   return send(origin,400,{error:"Every topic requires a subject and chapter"});
  rows.push(clean);
 }
 const {data,error}=await db.rpc("mednest_syllabus_stage_outline",{
  p_actor:user.id,p_session:j.session_id,p_rows:rows
 });
 if(error)return send(origin,409,{error:"Syllabus upload rejected; check duplicate or invalid hierarchy"});
 return send(origin,200,{result:data});
});