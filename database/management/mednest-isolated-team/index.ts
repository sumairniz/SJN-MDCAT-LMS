// SJN MedNest Academy — isolated staff directory, guarded staging foundation.
// This version intentionally exposes READ ONLY actions. No team write or invite
// acceptance endpoints until email sender, step-up and owner UAT are complete.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const REF="tdqbjhrmfluiinntmjfh";
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+|-git-sjn-phase1a-foundation)-sjn1\.vercel\.app$/;
const db=createClient(URL,SERVICE,{auth:{autoRefreshToken:false,persistSession:false}});
const reply=(origin,status,data)=>new Response(JSON.stringify(data),{status,headers:{
 "content-type":"application/json","cache-control":"no-store, private","vary":"Origin",
 "x-content-type-options":"nosniff","access-control-allow-origin":origin||"null"
}});
function claims(token){try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}
const uuid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
function safeSummary(m,chief){
 return {
  id:m.user_id,role:m.technical_role,status:m.status,
  display_name:m.display_name,organizational_title:m.organizational_title,
  permissions:chief?(m.technical_role==="chief_admin"?["*"]:m.permissions):[],
  // Chief-only view; ordinary members never receive other users' emails.
  ...(chief?{email:m.email}:{})
 };
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!ORIGIN.test(origin))return reply("",403,{error:"Unauthorized Management origin"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin,
  "access-control-allow-headers":"authorization,apikey,content-type",
  "access-control-allow-methods":"POST,OPTIONS","vary":"Origin"
 }});
 if(req.method!=="POST")return reply(origin,405,{error:"Invalid method"});
 if(URL!=="https://"+REF+".supabase.co"||!SERVICE)return reply(origin,503,{error:"Dedicated staff project unavailable"});
 let body;
 try{body=await req.json();if(JSON.stringify(body).length>300||!["team.list","audit.list"].includes(body?.action))throw Error()}
 catch{return reply(origin,400,{error:"Unsupported staff operation"})}
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._-]+$/.test(bearer))return reply(origin,401,{error:"Authentication required"});
 const token=bearer.slice(7),j=claims(token);
 if(!j||j.iss!==URL+"/auth/v1"||j.aud!=="authenticated"||!uuid(j.session_id))
  return reply(origin,401,{error:"Invalid isolated staff token"});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user||user.id!==j.sub||!user.email_confirmed_at)return reply(origin,401,{error:"Verified management sign-in required"});
 const {data:live,error:liveError}=await db.rpc("mednest_staff_session_live",{p_user_id:user.id,p_session_id:j.session_id});
 if(liveError||!live)return reply(origin,401,{error:"Signed-in staff session expired"});
 const {data:actor,error:actorError}=await db.from("mednest_staff_members")
  .select("technical_role,status,permissions,email").eq("user_id",user.id).maybeSingle();
 if(actorError||!actor||actor.status!=="active"||actor.email!==user.email?.trim().toLowerCase())
  return reply(origin,403,{error:"Staff access denied"});
 const chief=actor.technical_role==="chief_admin";
 if(body.action==="team.list"){
  if(!chief)return reply(origin,403,{error:"Only Chief Administrator can view staff directory"});
  const [members,invitations]=await Promise.all([
   db.from("mednest_staff_members").select("user_id,email,technical_role,status,permissions,display_name,organizational_title")
    .order("created_at",{ascending:true}).limit(100),
   db.from("mednest_staff_invitations").select("id,email,display_name,organizational_title,expires_at,state")
    .eq("state","pending").gt("expires_at",new Date().toISOString()).limit(100)
  ]);
  if(members.error||invitations.error)return reply(origin,503,{error:"Staff directory temporarily unavailable"});
  const list=members.data||[];
  return reply(origin,200,{chief:list.filter(m=>m.technical_role==="chief_admin").map(m=>safeSummary(m,true)),
   members:list.filter(m=>m.technical_role==="member").map(m=>safeSummary(m,true)),
   invitations:invitations.data||[],mutations_enabled:false,invitation_delivery_enabled:false});
 }
 if(!chief&&!(actor.permissions||[]).includes("audit.view"))
  return reply(origin,403,{error:"Missing activity-log permission"});
 const {data:events,error:eventsError}=await db.from("mednest_staff_audit")
  .select("id,action,created_at").order("created_at",{ascending:false}).limit(50);
 if(eventsError)return reply(origin,503,{error:"Activity log unavailable"});
 // Strict shared allowlist: no event details, email, actor UUID, target UUID or PII.
 return reply(origin,200,{events:(events||[]).map(e=>({
  action:e.action,created_at:e.created_at
 }))});
});
