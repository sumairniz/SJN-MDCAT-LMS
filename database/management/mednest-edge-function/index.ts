// SJN MedNest Management Panel — separate, role-checked staff API.
// No student authentication settings, student tables or grading endpoints are used.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const RESEND=Deno.env.get("RESEND_API_KEY")||"";
const SENDER=Deno.env.get("MEDNEST_STAFF_EMAIL_FROM")||"";
const ORIGINS=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+)?-sjn1\.vercel\.app$/;
const PERMS=new Set([
 "content.view","content.create","content.edit","content.import","content.review","content.publish","content.archive",
 "taxonomy.manage","pastpapers.manage","courses.manage","courses.publish","resources.manage",
 "students.view","students.details","students.create","students.suspend",
 "enrollments.grant","enrollments.revoke","access.change","reports.view","reports.resolve",
 "analytics.view","audit.view","finance.verify","announcements.manage"
]);
const ACTIONS=new Set(["me","team.list","team.invite","team.update","team.revoke_invite","audit.list","invite.preview","invite.accept"]);
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
function response(origin,status,body){return new Response(JSON.stringify(body),{status,headers:{
 "content-type":"application/json; charset=utf-8","cache-control":"no-store, private",
 "access-control-allow-origin":origin||"null","access-control-allow-headers":"authorization,apikey,content-type,x-client-info",
 "access-control-allow-methods":"POST,OPTIONS","vary":"Origin","x-content-type-options":"nosniff"
}});}
const uuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const tokenFormat=s=>typeof s==="string"&&/^[a-f0-9]{64}$/i.test(s);
const safeString=(v,max=100)=>typeof v==="string"&&v.trim().length<=max?v.trim():null;
const safeMember=m=>({
 id:m.user_id,email:m.email,role:m.technical_role,status:m.status,permissions:m.technical_role==="chief_admin"?["*"]:m.permissions,
 display_name:m.display_name,organizational_title:m.organizational_title,created_at:m.created_at,updated_at:m.updated_at
});
function digestJwt(token){try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}
async function sha256(text){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function token64(){return [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,"0")).join("")}
function validatePermissions(list){
 return Array.isArray(list)&&list.length<=PERMS.size&&new Set(list).size===list.length&&list.every(x=>PERMS.has(x));
}
async function checkStepup(uid,session){
 const {data,error}=await db.from("mednest_management_stepup").select("verified_until")
 .eq("user_id",uid).eq("session_id",session).maybeSingle();
 if(error)return null;
 return Boolean(data?.verified_until&&new Date(data.verified_until)>new Date());
}
async function sendInvitation(email,link){
 const result=await fetch("https://api.resend.com/emails",{
  method:"POST",
  headers:{"authorization":"Bearer "+RESEND,"content-type":"application/json"},
  body:JSON.stringify({
    from:SENDER,to:[email],subject:"Your SJN MedNest Management Panel invitation",
    text:"You have been invited to the SJN MedNest Management Panel.\n\nOpen your personal, one-time invitation link to establish your account:\n"+link+
      "\n\nThis invitation expires after 72 hours. Do not share this link.\nIf you weren't expecting this invitation, ignore the message."
  })
 });
 return result.ok;
}
Deno.serve(async req=>{
 const origin=req.headers.get("Origin")||"";
 if(!ORIGINS.test(origin))return response("",403,{error:"Management origin not authorized"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
 "access-control-allow-origin":origin,"access-control-allow-headers":"authorization,apikey,content-type,x-client-info",
 "access-control-allow-methods":"POST,OPTIONS","vary":"Origin","access-control-max-age":"600"}});
 if(req.method!=="POST")return response(origin,405,{error:"Method not allowed"});
 if(!URL||!SERVICE)return response(origin,503,{error:"Staff management unavailable"});
 let body={};
 try{body=await req.json();if(!body||!ACTIONS.has(body.action)||JSON.stringify(body).length>14000)throw Error()}catch{return response(origin,400,{error:"Invalid request"})}
 const action=body.action;
 if(action==="invite.preview"){
  if(!tokenFormat(body.token))return response(origin,400,{error:"Invalid invitation"});
  const {data,error}=await db.from("mednest_management_invitations")
   .select("email,display_name,organizational_title,expires_at,state")
   .eq("token_hash",await sha256(body.token.toLowerCase())).maybeSingle();
  if(error)return response(origin,503,{error:"Invitation lookup unavailable"});
  if(!data||data.state!=="pending"||new Date(data.expires_at)<=new Date())
   return response(origin,410,{error:"Invitation expired or no longer valid"});
  return response(origin,200,{invitation:{
   email:data.email,display_name:data.display_name,organizational_title:data.organizational_title,expires_at:data.expires_at
  }});
 }
 const header=req.headers.get("Authorization")||"";
 if(!/^Bearer [A-Za-z0-9._-]+$/.test(header))return response(origin,401,{error:"Sign in required"});
 const jwt=header.slice(7),j=digestJwt(jwt);
 if(!j||!uuid(j.session_id))return response(origin,401,{error:"Invalid staff session"});
 const {data:verification,error:authError}=await db.auth.getUser(jwt);
 if(authError||!verification?.user?.id||!verification.user.email_confirmed_at)
  return response(origin,401,{error:"Verified authentication required"});
 const user=verification.user;
 if(j.sub!==user.id)return response(origin,401,{error:"Invalid staff identity"});
 const email=(user.email||"").toLowerCase();
 if(action==="invite.accept"){
  if(!tokenFormat(body.token))return response(origin,400,{error:"Invalid invitation"});
  const {data,error}=await db.rpc("mednest_accept_management_invitation",{
    p_user_id:user.id,p_email:email,p_token_hash:await sha256(body.token.toLowerCase())
  });
  if(error)return response(origin,503,{error:"Unable to complete invitation acceptance"});
  if(data!=="accepted")return response(origin,403,{error:"Invitation expired, already accepted, or does not match this account"});
  return response(origin,200,{accepted:true,message:"Your verified staff invitation is active."});
 }
 const {data:member,error:memberError}=await db.from("mednest_management_members")
 .select("user_id,email,technical_role,status,permissions,display_name,organizational_title,created_at,updated_at")
 .eq("user_id",user.id).maybeSingle();
 if(memberError)return response(origin,503,{error:"Unable to check staff authorization"});
 if(!member||member.status!=="active"||member.email!==email)
  return response(origin,403,{error:"Management account not authorized"});
 if(action==="me")return response(origin,200,{member:safeMember(member),verified:true});
 if(action==="team.list"){
  if(member.technical_role!=="chief_admin")return response(origin,403,{error:"Chief Admin only"});
  const [members,invitations]=await Promise.all([
    db.from("mednest_management_members")
    .select("user_id,email,technical_role,status,permissions,display_name,organizational_title,created_at,updated_at")
    .order("created_at",{ascending:false}).limit(100),
    db.from("mednest_management_invitations")
    .select("id,email,display_name,organizational_title,created_at,expires_at,state")
    .eq("state","pending").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(100)
  ]);
  if(members.error||invitations.error)return response(origin,503,{error:"Unable to load staff directory"});
  return response(origin,200,{members:members.data.map(safeMember),invitations:invitations.data});
 }
 if(action==="audit.list"){
  if(member.technical_role!=="chief_admin"&&!member.permissions.includes("audit.view"))
   return response(origin,403,{error:"Missing activity permission"});
  const {data,error}=await db.from("mednest_management_audit")
   .select("id,actor_user_id,action,target_user_id,details,created_at")
   .order("created_at",{ascending:false}).limit(50);
  if(error)return response(origin,503,{error:"Activity unavailable"});
  return response(origin,200,{events:data});
 }
 if(member.technical_role!=="chief_admin")return response(origin,403,{error:"Only Chief Admin may change staff access"});
 const verifiedStepup=await checkStepup(user.id,j.session_id);
 if(verifiedStepup===null)return response(origin,503,{error:"Unable to verify email authorization"});
 if(!verifiedStepup)return response(origin,403,{error:"Verify a fresh email security code before changing staff access",stepup_required:true});
 if(action==="team.invite"){
  if(!RESEND||!SENDER||/onboarding@resend\.dev/i.test(SENDER))
   return response(origin,503,{error:"Invitations to other people require a verified academy email sending domain. Configure MEDNEST_STAFF_EMAIL_FROM in the staging Supabase Edge Function secrets."});
  const emailTo=safeString(body.email,254)?.toLowerCase();
  if(!emailTo||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo))
   return response(origin,400,{error:"Valid email required"});
  if(!validatePermissions(body.permissions))return response(origin,400,{error:"Invalid permission assignment"});
  const name=body.display_name===null||body.display_name===""?null:safeString(body.display_name);
  const title=body.organizational_title===null||body.organizational_title===""?null:safeString(body.organizational_title);
  if((body.display_name&&!name)||(body.organizational_title&&!title))return response(origin,400,{error:"Invalid name or title"});
  const token=token64();
  const {data:inviteId,error:inviteError}=await db.rpc("mednest_create_management_invitation",{
    p_actor:user.id,p_session:j.session_id,p_email:emailTo,p_token_hash:await sha256(token),
    p_permissions:body.permissions,p_display_name:name,p_title:title
  });
  if(inviteError||!inviteId)return response(origin,409,{error:"Invitation could not be created. This email may already have a pending invitation or staff access."});
  const link=origin+"/#invite="+token;
  try{
   if(!(await sendInvitation(emailTo,link))){
    await db.rpc("mednest_revoke_management_invitation",{p_actor:user.id,p_session:j.session_id,p_invite:inviteId});
    return response(origin,503,{error:"Invitation delivery failed and the invitation was revoked. Check academy email-domain verification."});
   }
  }catch(_){
   await db.rpc("mednest_revoke_management_invitation",{p_actor:user.id,p_session:j.session_id,p_invite:inviteId});
   return response(origin,503,{error:"Invitation delivery unavailable; pending invitation revoked"});
  }
  return response(origin,201,{created:true,message:"Staff invitation sent. The member must accept the one-time link."});
 }
 if(action==="team.revoke_invite"){
  if(!uuid(body.invitation_id))return response(origin,400,{error:"Invalid invitation ID"});
  const {data,error}=await db.rpc("mednest_revoke_management_invitation",{
    p_actor:user.id,p_session:j.session_id,p_invite:body.invitation_id
  });
  if(error)return response(origin,503,{error:"Unable to revoke invitation"});
  if(data!=="revoked")return response(origin,403,{error:"Invitation not revocable"});
  return response(origin,200,{revoked:true});
 }
 if(action==="team.update"){
  if(!uuid(body.user_id)||body.user_id===user.id)return response(origin,403,{error:"Chief Admin cannot edit own role"});
  if(!["active","suspended"].includes(body.status))return response(origin,400,{error:"Invalid staff status"});
  if(!validatePermissions(body.permissions))return response(origin,400,{error:"Invalid permission assignment"});
  const name=body.display_name===null||body.display_name===""?null:safeString(body.display_name);
  const title=body.organizational_title===null||body.organizational_title===""?null:safeString(body.organizational_title);
  if((body.display_name&&!name)||(body.organizational_title&&!title))return response(origin,400,{error:"Invalid name or title"});
  const {data,error}=await db.rpc("mednest_update_member_with_email_stepup",{
    p_actor:user.id,p_session:j.session_id,p_target:body.user_id,p_status:body.status,
    p_permissions:body.permissions,p_display_name:name,p_title:title
  });
  if(error)return response(origin,503,{error:"Unable to save management permissions"});
  if(data==="stepup_required")return response(origin,403,{error:"Verify email security again",stepup_required:true});
  if(data!=="updated")return response(origin,403,{error:"Member is not editable"});
  return response(origin,200,{success:true,message:"Management member updated and change audited"});
 }
 return response(origin,400,{error:"Unknown request"});
});
