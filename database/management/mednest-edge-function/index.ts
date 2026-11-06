// SJN MedNest Management Panel — dedicated staging staff API.
// All authorization here is server-side; never accepts user_metadata or UI role labels.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const URL = Deno.env.get("SUPABASE_URL") || "";
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const ADMIN_ORIGINS = /^https:\/\/sjn-mednest-management(?:-[a-z0-9]+)?-sjn1\.vercel\.app$/;
const PERMISSIONS = new Set([
  "content.view","content.create","content.edit","content.import","content.review","content.publish","content.archive",
  "taxonomy.manage","pastpapers.manage","courses.manage","courses.publish",
  "resources.manage","students.view","students.details","students.create","students.suspend",
  "enrollments.grant","enrollments.revoke","access.change","reports.view","reports.resolve",
  "analytics.view","audit.view","finance.verify","announcements.manage"
]);
const operations = new Set(["me","team.list","team.invite","team.update","audit.list"]);
const srv = createClient(URL, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });
const asString = (v,n=120) => typeof v === "string" && v.trim().length <= n ? v.trim() : "";
function reply(origin,status,body){
  return new Response(JSON.stringify(body),{
    status, headers:{
      "Content-Type":"application/json; charset=utf-8",
      "Cache-Control":"no-store, private",
      "Vary":"Origin",
      "Access-Control-Allow-Origin":origin||"null",
      "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
      "Access-Control-Allow-Methods":"POST,OPTIONS",
      "X-Content-Type-Options":"nosniff"
    }
  });
}
function safeMember(m){
  return {
    id:m.user_id,email:m.email,role:m.technical_role,status:m.status,
    display_name:m.display_name,organizational_title:m.organizational_title,
    permissions:m.technical_role==="chief_admin"?["*"]:m.permissions,
    created_at:m.created_at,updated_at:m.updated_at
  };
}
async function audit(actor,action,target,details={}){
  const {error}=await srv.from("mednest_management_audit").insert({
    actor_user_id:actor,action,target_user_id:target||null,details
  });
  if(error)throw new Error("Audit write failed; operation status requires review");
}
function validUuid(v){return typeof v==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)}
Deno.serve(async req=>{
 const origin=req.headers.get("Origin")||"";
 if(!ADMIN_ORIGINS.test(origin))return reply("",403,{error:"Origin not authorized"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Max-Age":"600","Vary":"Origin"}});
 if(req.method!=="POST")return reply(origin,405,{error:"Method not allowed"});
 if(!URL || !SECRET || !ANON) return reply(origin,503,{error:"Management service is not configured"});
 const authHeader=req.headers.get("Authorization")||"";
 if(!/^Bearer [A-Za-z0-9._-]+$/.test(authHeader))return reply(origin,401,{error:"Staff authentication required"});
 const jwt=authHeader.slice(7);
 const {data:verified,error:authError}=await srv.auth.getUser(jwt);
 if(authError||!verified?.user?.id||!verified.user.email_confirmed_at)return reply(origin,401,{error:"Verified email and authentication required"});
 const identity=verified.user;
 const {data:member,error:membershipError}=await srv.from("mednest_management_members")
   .select("user_id,email,technical_role,status,permissions,display_name,organizational_title,created_at,updated_at")
   .eq("user_id",identity.id).maybeSingle();
 if(membershipError)return reply(origin,503,{error:"Membership lookup unavailable"});
 if(!member||member.email!==identity.email?.toLowerCase()||member.status==="suspended")
   return reply(origin,403,{error:"Management account not authorized"});
 let action,body;
 try{
   body=await req.json();
   action=body?.action;
   if(!operations.has(action) || JSON.stringify(body).length>12000) return reply(origin,400,{error:"Invalid management request"});
 }catch(_){return reply(origin,400,{error:"Invalid request body"})}
 // The AAL claim is inspected ONLY after the exact JWT was verified by Supabase Auth.
 // Supabase Auth issues 'aal2' only for a completed MFA challenge.
 let aal="";
 try{
  const payload=jwt.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
  aal=JSON.parse(atob(payload)).aal;
 }catch(_){return reply(origin,401,{error:"Invalid authenticated session"})}
 if(action==="me"){
   return reply(origin,200,{member:safeMember(member),mfa_required:aal!=="aal2",verified:true});
 }
 if(aal!=="aal2")return reply(origin,403,{error:"Authenticator verification required",mfa_required:true});
 if(member.status!=="active"&&member.status!=="invited")return reply(origin,403,{error:"Account inactive"});
 // An invitation creates an explicit membership. It becomes active only after
 // the verified invited account completes MFA and proves its mailbox.
 if(member.status==="invited"){
    const {error:e}=await srv.from("mednest_management_members").update({status:"active",updated_at:new Date().toISOString()}).eq("user_id",identity.id).eq("status","invited");
    if(e)return reply(origin,503,{error:"Account activation unavailable"});
    try{await audit(identity.id,"staff.activate",identity.id,{method:"verified_mfa_invitation"})}catch(_){return reply(origin,503,{error:"Activation audit unavailable"})}
    member.status="active";
 }
 if(action==="team.list"){
    if(member.technical_role!=="chief_admin")return reply(origin,403,{error:"Chief Admin only"});
    const {data,error}=await srv.from("mednest_management_members")
      .select("user_id,email,technical_role,status,permissions,display_name,organizational_title,created_at,updated_at")
      .order("created_at",{ascending:false}).limit(100);
    if(error)return reply(origin,503,{error:"Unable to load management team"});
    return reply(origin,200,{members:data.map(safeMember),total:data.length,limited:data.length===100});
 }
 if(action==="audit.list"){
    if(member.technical_role!=="chief_admin"&&!member.permissions.includes("audit.view"))return reply(origin,403,{error:"Missing audit permission"});
    const {data,error}=await srv.from("mednest_management_audit")
      .select("id,actor_user_id,action,target_user_id,details,created_at")
      .order("created_at",{ascending:false}).limit(50);
    if(error)return reply(origin,503,{error:"Unable to load activity"});
    return reply(origin,200,{events:data});
 }
 if(member.technical_role!=="chief_admin")return reply(origin,403,{error:"Only Chief Admin can manage staff access"});
 if(action==="team.invite"){
   const email=asString(body.email,254).toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254)return reply(origin,400,{error:"Valid email required"});
   const permissions=body.permissions;
   if(!Array.isArray(permissions)||permissions.length>PERMISSIONS.size||
      permissions.some(p=>!PERMISSIONS.has(p))||new Set(permissions).size!==permissions.length)
      return reply(origin,400,{error:"Invalid permission assignment"});
   const displayName=asString(body.display_name,100)||null;
   const title=asString(body.organizational_title,100)||null;
   // Invites never grant Chief Admin status. Email must not be bound to an
   // existing student account implicitly or via user-editable metadata.
   const {data:invited,error:inviteError}=await srv.auth.admin.inviteUserByEmail(email);
   if(inviteError||!invited?.user?.id)return reply(origin,409,{error:"Invitation could not be created; check for an existing account"});
   const {error:insertError}=await srv.from("mednest_management_members").insert({
     user_id:invited.user.id,email,technical_role:"member",status:"invited",
     permissions,display_name:displayName,organizational_title:title,invited_by:identity.id
   });
   if(insertError)return reply(origin,503,{error:"Invitation sent but membership could not be registered; administrator review required"});
   try{await audit(identity.id,"staff.invite",invited.user.id,{email,permissions})}
   catch(_){return reply(origin,503,{error:"Invitation registered but audit failed; administrator review required"})}
   return reply(origin,201,{success:true,message:"Team invitation created"});
 }
 if(action==="team.update"){
   const target=body.user_id;
   if(!validUuid(target)||target===identity.id)return reply(origin,400,{error:"Cannot modify Chief Admin or own privileges"});
   const {data:person,error:existingError}=await srv.from("mednest_management_members")
      .select("user_id,technical_role,status").eq("user_id",target).maybeSingle();
   if(existingError||!person)return reply(origin,404,{error:"Member not found"});
   if(person.technical_role==="chief_admin")return reply(origin,403,{error:"Chief Admin cannot be modified"});
   const fields={updated_at:new Date().toISOString()};
   let changed=0;
   if(body.status!==undefined){
      if(!["active","suspended","invited"].includes(body.status))return reply(origin,400,{error:"Invalid status"});
      fields.status=body.status;changed++;
   }
   if(body.permissions!==undefined){
      const p=body.permissions;
      if(!Array.isArray(p)||p.length>PERMISSIONS.size||p.some(x=>!PERMISSIONS.has(x))||new Set(p).size!==p.length)
        return reply(origin,400,{error:"Invalid permissions"});
      fields.permissions=p;changed++;
   }
   if(body.display_name!==undefined){
     if(body.display_name!==null && (typeof body.display_name!=="string"||body.display_name.length>100))
       return reply(origin,400,{error:"Invalid display name"});
     fields.display_name=asString(body.display_name,100)||null;changed++;
   }
   if(body.organizational_title!==undefined){
     if(body.organizational_title!==null && (typeof body.organizational_title!=="string"||body.organizational_title.length>100))
       return reply(origin,400,{error:"Invalid title"});
     fields.organizational_title=asString(body.organizational_title,100)||null;changed++;
   }
   if(!changed)return reply(origin,400,{error:"No changes submitted"});
   const {error:updateError}=await srv.from("mednest_management_members").update(fields)
     .eq("user_id",target).eq("technical_role","member");
   if(updateError)return reply(origin,503,{error:"Update failed"});
   try{await audit(identity.id,"staff.update",target,{fields:Object.keys(fields).filter(k=>k!=="updated_at"),status:fields.status||null})}
   catch(_){return reply(origin,503,{error:"Update audit failed; administrator review required"})}
   return reply(origin,200,{success:true,message:"Member updated"});
 }
 return reply(origin,400,{error:"Unknown operation"});
});
