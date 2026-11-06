import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
// Dedicated Management Auth project only. Not a student-endpoint proxy.
// No staff invitations or student reads/writes in this limited foundation API.
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const PROJECT_REF="tdqbjhrmfluiinntmjfh";
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+|-git-sjn-phase1a-foundation)-sjn1\.vercel\.app$/;
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
function reply(origin,status,data){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","access-control-allow-origin":origin||"null","vary":"Origin","x-content-type-options":"nosniff","cache-control":"no-store"}})}
function jwtPayload(token){try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}
function memberPublic(member){return {
 role:member.technical_role,status:member.status,
 display_name:member.display_name,organizational_title:member.organizational_title,
 email:member.email // the signed-in Chief's OWN email only; not a team lookup
}}
Deno.serve(async (req)=>{
 const origin=req.headers.get("origin")||"";
 if(!ORIGIN.test(origin))return reply("",403,{error:"Origin denied"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":origin,"access-control-allow-headers":"authorization,apikey,content-type","access-control-allow-methods":"POST,OPTIONS","vary":"Origin"}});
 if(req.method!=="POST")return reply(origin,405,{error:"Method denied"});
 if(!URL.includes(PROJECT_REF)||!SERVICE)return reply(origin,503,{error:"Dedicated staff API is not configured"});
 let payload;
 try{payload=await req.json();if(JSON.stringify(payload).length>2000||!["me","profile.update"].includes(payload?.action))throw Error()}catch{return reply(origin,400,{error:"Invalid request"})}
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [a-zA-Z0-9._-]+$/.test(bearer))return reply(origin,401,{error:"Sign in required"});
 const token=bearer.slice(7),j=jwtPayload(token);
 if(!j||j.iss!==URL+"/auth/v1"||j.aud!=="authenticated"||typeof j.session_id!=="string")return reply(origin,401,{error:"Invalid staff token"});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user?.email_confirmed_at||user.id!==j.sub)return reply(origin,401,{error:"Verified management email required"});
 const {data:live,error:sessionError}=await db.rpc("mednest_staff_session_live",{p_user_id:user.id,p_session_id:j.session_id});
 if(sessionError||!live)return reply(origin,401,{error:"Staff session unavailable"});
 let {data:member,error:readError}=await db.from("mednest_staff_members")
  .select("user_id,email,technical_role,status,display_name,organizational_title").eq("user_id",user.id).maybeSingle();
 if(readError)return reply(origin,503,{error:"Staff access unavailable"});
 if(!member){
  // Single-use privately approved Chief email fingerprint, verified again in SQL.
  const {data:claim,error:claimError}=await db.rpc("mednest_staff_claim_chief",{p_user_id:user.id});
  if(claimError)return reply(origin,503,{error:"Staff account verification unavailable"});
  if(!["activated","already_active"].includes(claim))return reply(origin,403,{error:"No approved Chief Administrator identity matches this verified account"});
  const r=await db.from("mednest_staff_members")
   .select("user_id,email,technical_role,status,display_name,organizational_title").eq("user_id",user.id).maybeSingle();
  if(r.error||!r.data)return reply(origin,503,{error:"Chief account setup unavailable"});
  member=r.data;
 }
 if(member.status!=="active"||member.technical_role!=="chief_admin"||member.email!==(user.email||"").toLowerCase())
   return reply(origin,403,{error:"Management access denied"});
 if(payload.action==="me")return reply(origin,200,{member:memberPublic(member)});
 const name=payload.display_name, title=payload.organizational_title;
 if(!([null,undefined].includes(name)||typeof name==="string")||
    !([null,undefined].includes(title)||typeof title==="string")||
    (typeof name==="string"&&name.trim().length>100)||
    (typeof title==="string"&&title.trim().length>100))
   return reply(origin,400,{error:"Invalid name or title"});
 const {data:updated,error:writeError}=await db.rpc("mednest_staff_update_chief_profile",{
  p_user_id:user.id,p_display_name:name??null,p_organizational_title:title??null
 });
 if(writeError||updated!=="updated")return reply(origin,403,{error:"Profile update denied"});
 const r=await db.from("mednest_staff_members").select("user_id,email,technical_role,status,display_name,organizational_title").eq("user_id",user.id).single();
 if(r.error)return reply(origin,503,{error:"Profile saved; refresh to view"});
 return reply(origin,200,{success:true,member:memberPublic(r.data)});
});
