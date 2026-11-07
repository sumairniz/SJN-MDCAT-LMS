// Staff-management mutation transport — staged, intentionally DISABLED by default.
// One-time owner activation requires verified sender, security UAT and separate code review.
// All identity and authorization is in dedicated project, never Student LMS.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const RESEND=Deno.env.get("RESEND_API_KEY")||"";
const SENDER=Deno.env.get("MEDNEST_STAFF_EMAIL_FROM")||"";
const INVITE_BASE="https://sjn-mednest-management-git-sjn-phase1a-foundation-sjn1.vercel.app/isolated-staff-invite.html";
// Gate is deliberately hard-coded false; configuration alone cannot activate writes.
const WRITES_ENABLED=false; // Hard-disabled; configure secrets alone cannot switch on invitations.
const SENDER_APPROVED=Deno.env.get("MEDNEST_STAFF_SENDER_VERIFIED")==="true";
const REF="tdqbjhrmfluiinntmjfh";
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+|-git-sjn-phase1a-foundation)-sjn1\.vercel\.app$/;
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
const response=(origin,status,data)=>new Response(JSON.stringify(data),{status,headers:{
 "content-type":"application/json","cache-control":"no-store, private","vary":"Origin",
 "access-control-allow-origin":origin||"null","x-content-type-options":"nosniff"
}});
const uuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const code=s=>typeof s==="string"&&/^[0-9a-f]{64}$/.test(s);
const jwtClaims=token=>{try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}};
const senderConfigured=()=>Boolean(
 RESEND && SENDER_APPROVED && /^\S.+<[^@\s<>]+@[^@\s<>]+>$/.test(SENDER)
 && !/onboarding@resend\.dev/i.test(SENDER)
);
const validatePermissions=p=>Array.isArray(p)&&p.length<=26&&p.every(x=>typeof x==="string"&&x.length<=48)&&new Set(p).size===p.length;
const hash=async token=>{
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
};
const createToken=()=>[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,"0")).join("");
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!ORIGIN.test(origin))return response("",403,{error:"Management origin denied"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin,"access-control-allow-headers":"authorization,apikey,content-type",
  "access-control-allow-methods":"POST,OPTIONS","vary":"Origin"
 }});
 if(req.method!=="POST")return response(origin,405,{error:"Invalid method"});
 if(URL!=="https://"+REF+".supabase.co"||!SERVICE)return response(origin,503,{error:"Staff management unavailable"});
 let body;
 try{body=await req.json();if(!body||JSON.stringify(body).length>8000||![
  "capabilities","team.invite","team.update","team.revoke_invite","invite.preview","invite.accept"
 ].includes(body.action))throw Error()}
 catch{return response(origin,400,{error:"Unsupported action"})}
 if(!["capabilities","invite.preview"].includes(body.action)&&!WRITES_ENABLED)
  return response(origin,503,{error:"Staff access changes remain disabled pending verified email delivery and owner security UAT"});
 const token=(req.headers.get("authorization")||"").replace(/^Bearer /,"");
 const claims=jwtClaims(token);
 const sessionValid=claims?.iss===URL+"/auth/v1"&&claims?.aud==="authenticated"&&uuid(claims?.session_id);
 if(!sessionValid)return response(origin,401,{error:"Verified staff sign-in required"});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user?.email_confirmed_at||user.id!==claims.sub)
  return response(origin,401,{error:"Verified management identity required"});
 const {data:live,error:liveError}=await db.rpc("mednest_staff_session_live",{p_user_id:user.id,p_session_id:claims.session_id});
 if(liveError||!live)return response(origin,401,{error:"Staff session expired"});
 const {data:actor,error:actorError}=await db.from("mednest_staff_members")
  .select("technical_role,status,email").eq("user_id",user.id).maybeSingle();
 const isChief=Boolean(!actorError&&actor?.status==="active"&&actor?.technical_role==="chief_admin"
  &&actor.email===(user.email||"").toLowerCase());
 if(body.action==="capabilities"){
  if(!isChief)return response(origin,403,{error:"Chief Administrator only"});
  return response(origin,200,{
   staff_writes_enabled:WRITES_ENABLED,
   staff_sender_configured:senderConfigured(),
   staff_invitation_delivery_enabled:WRITES_ENABLED&&senderConfigured()
  });
 }
 // Invitation preview is available only to the EXACT signed-in verified recipient.
 // Tokens are never accepted as authorization without matching email + live session.
 if(body.action==="invite.preview"){
  if(!code(body.token))return response(origin,400,{error:"Invalid invitation"});
  const {data:inv,error:invError}=await db.from("mednest_staff_invitations")
   .select("display_name,organizational_title,email,expires_at,state,delivery_status")
   .eq("token_hash",await hash(body.token)).maybeSingle();
  if(invError)return response(origin,503,{error:"Invitation lookup unavailable"});
  if(!inv||inv.email!==(user.email||"").trim().toLowerCase()
    ||inv.state!=="pending"||inv.delivery_status!=="sent"
    ||new Date(inv.expires_at)<=new Date())
   return response(origin,403,{error:"No valid invitation for this verified management email"});
  return response(origin,200,{invitation:{
   display_name:inv.display_name,organizational_title:inv.organizational_title,
   email:inv.email,expires_at:inv.expires_at
  },acceptance_enabled:WRITES_ENABLED});
 }
 // Live staff mutations remain disabled until owner-reviewed activation.
 if(!WRITES_ENABLED)return response(origin,503,{error:"Staff operations unavailable"});
 if(body.action==="invite.accept"){
  if(!code(body.token))return response(origin,400,{error:"Invalid invitation"});
  const {data:result,error}=await db.rpc("mednest_staff_accept_invitation",{
   p_user:user.id,p_hash:await hash(body.token)
  });
  if(error)return response(origin,503,{error:"Unable to complete invitation acceptance"});
  return result==="accepted"?response(origin,200,{accepted:true}):
   response(origin,403,{error:"Invitation invalid, expired, or does not match the verified email"});
 }
 if(!isChief)return response(origin,403,{error:"Chief Administrator required"});
 if(body.action==="team.invite"){
  if(!senderConfigured())return response(origin,503,{error:"Dedicated verified staff email sender is not configured"});
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  const name=typeof body.display_name==="string"?body.display_name.trim():null;
  const title=typeof body.organizational_title==="string"?body.organizational_title.trim():null;
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||
      (name&&name.length>100)||(title&&title.length>100)||
      !validatePermissions(body.permissions))
    return response(origin,400,{error:"Invalid invitation details"});
  const secret=createToken();
  const {data:invitationId,error:createError}=await db.rpc("mednest_staff_create_invitation",{
   p_actor:user.id,p_session:claims.session_id,p_email:email,p_hash:await hash(secret),
   p_name:name,p_title:title,p_permissions:body.permissions
  });
  if(createError){
   const stepupRequired=createError.message?.includes("staff_stepup_required");
   return response(origin,stepupRequired?403:409,{
    error:stepupRequired?"Email security approval is required":"Invitation cannot be created",
    ...(stepupRequired?{stepup_required:true}:{})
   });
  }
  // Persist-before-send with fail-closed compensation; never deliver an untracked token.
  let delivered=false;
  try{
   const out=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
    authorization:"Bearer "+RESEND,"content-type":"application/json"
   },body:JSON.stringify({
    from:SENDER,to:[email],subject:"Your SJN MedNest Academy staff invitation",
    text:"You have been invited to SJN MedNest Academy Management. \n\n"+
      "Open your private invitation link: "+INVITE_BASE+"#invite="+secret+
      "\n\nThis invitation expires after 72 hours. Do not share this link."
   })});
   delivered=out.ok;
  }catch{}
  // Invitation starts queued/nonredeemable; only the atomic service-role
  // finalize RPC can mark it sent after provider acceptance.
  const {data:finalized,error:finalizeError}=await db.rpc("mednest_staff_finalize_invitation_delivery",{
   p_actor:user.id,p_session:claims.session_id,p_invitation:invitationId,p_delivered:delivered
  });
  if(finalizeError||finalized!=="sent")
   return response(origin,503,{error:"Invitation could not be activated safely; contact Chief Administrator"});
  return response(origin,200,{sent:true});
 }
 if(body.action==="team.revoke_invite"){
  if(!uuid(body.invitation_id))return response(origin,400,{error:"Invalid invitation ID"});
  const {data:ok,error}=await db.rpc("mednest_staff_revoke_invitation",{
   p_actor:user.id,p_session:claims.session_id,p_invitation:body.invitation_id
  });
  if(error)return response(origin,503,{error:"Unable to revoke invitation"});
  return ok?response(origin,200,{revoked:true}):
   response(origin,403,{error:"Email approval is required or invitation is no longer pending",stepup_required:true});
 }
 if(body.action==="team.update"){
  if(!uuid(body.user_id)||!["active","suspended","revoked"].includes(body.status)||
    !validatePermissions(body.permissions))return response(origin,400,{error:"Invalid team changes"});
  const {data:outcome,error}=await db.rpc("mednest_staff_change_member",{
   p_actor:user.id,p_session:claims.session_id,p_target:body.user_id,p_new_status:body.status,
   p_name:typeof body.display_name==="string"?body.display_name.trim():null,
   p_title:typeof body.organizational_title==="string"?body.organizational_title.trim():null,
   p_permissions:body.permissions
  });
  if(error)return response(origin,503,{error:"Staff update unavailable"});
  return outcome==="updated"?response(origin,200,{updated:true}):
   response(origin,outcome==="stepup_required"?403:400,{
    error:outcome==="stepup_required"?"Sensitive-action email approval has expired":"Team update rejected",
    stepup_required:outcome==="stepup_required"
   });
 }
 return response(origin,400,{error:"Unsupported operation"});
});
