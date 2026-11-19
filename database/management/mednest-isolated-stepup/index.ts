// Dedicated isolated-staff security code service. NO student database interaction.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const RESEND=Deno.env.get("RESEND_API_KEY")||"";
const SENDER=Deno.env.get("MEDNEST_STAFF_EMAIL_FROM")||"";
const PEPPER=Deno.env.get("MEDNEST_STAFF_EMAIL_PEPPER")||"";
const REF="tdqbjhrmfluiinntmjfh";
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+|-git-sjn-phase1a-foundation)-sjn1\.vercel\.app$/;
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
const json=(origin,status,data)=>new Response(JSON.stringify(data),{status,headers:{
 "content-type":"application/json","cache-control":"no-store, private","vary":"Origin",
 "access-control-allow-origin":origin||"null","x-content-type-options":"nosniff"
}});
function claims(t){try{return JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}
const uuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const configured=()=>Boolean(RESEND && PEPPER.length>=32 && /^[^\s<>]+@[^\s<>]+$/.test(SENDER.replace(/^.*<([^<>]+)>$/,"$1")));
function generateCode(){
 const b=new Uint32Array(1), max=Math.floor(2**32/1e8)*1e8;
 do{crypto.getRandomValues(b)}while(b[0]>=max);
 return String(b[0]%1e8).padStart(8,"0");
}
async function hashCode(session,code){
 const enc=new TextEncoder();
 const key=await crypto.subtle.importKey("raw",enc.encode(PEPPER),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const digest=await crypto.subtle.sign("HMAC",key,enc.encode("SJN-MEDNEST-STAFF-STEPUP-v1:"+session+":"+code));
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!ORIGIN.test(origin))return json("",403,{error:"Management origin not authorized"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin,"access-control-allow-headers":"authorization,apikey,content-type",
  "access-control-allow-methods":"POST,OPTIONS","vary":"Origin"
 }});
 if(req.method!=="POST")return json(origin,405,{error:"Method not allowed"});
 if(!URL.startsWith("https://"+REF+".supabase.co")||!SERVICE)return json(origin,503,{error:"Staff security unavailable"});
 const h=req.headers.get("authorization")||"";
 if(!/^Bearer [\w.-]+$/.test(h))return json(origin,401,{error:"Staff sign-in required"});
 const jwt=h.slice(7),c=claims(jwt);
 if(!c||c.iss!==URL+"/auth/v1"||c.aud!=="authenticated"||!uuid(c.session_id))
  return json(origin,401,{error:"Invalid staff session"});
 const {data:{user},error:authError}=await db.auth.getUser(jwt);
 if(authError||!user||user.id!==c.sub||!user.email_confirmed_at)return json(origin,401,{error:"Verified staff identity required"});
 const {data:live,error:liveError}=await db.rpc("mednest_staff_session_live",{p_user_id:user.id,p_session_id:c.session_id});
 if(liveError||!live)return json(origin,401,{error:"Staff session expired"});
 const {data:member,error:mError}=await db.from("mednest_staff_members")
  .select("technical_role,status,email").eq("user_id",user.id).maybeSingle();
 if(mError||!member||member.technical_role!=="chief_admin"||member.status!=="active"||
   member.email!==(user.email||"").trim().toLowerCase())
  return json(origin,403,{error:"Chief Administrator authorization required"});
 let body;
 try{body=await req.json();if(JSON.stringify(body).length>300||!["status","send","verify"].includes(body?.action))throw Error()}
 catch{return json(origin,400,{error:"Invalid security request"})}
 if(body.action==="status"){
  const {data,error}=await db.from("mednest_staff_stepup").select("verified_until")
   .eq("user_id",user.id).eq("session_id",c.session_id).maybeSingle();
  if(error)return json(origin,503,{error:"Security status unavailable"});
  const verified=Boolean(data?.verified_until&&new Date(data.verified_until).getTime()>Date.now());
  return json(origin,200,{verified,expires_at:verified?data.verified_until:null,configured:configured()});
 }
 if(!configured())return json(origin,503,{error:"Secure email sender is not yet configured for isolated staff authentication"});
 if(body.action==="send"){
  // Code is only in memory; ONLY its keyed HMAC persists in protected DB.
  const code=generateCode(),digest=await hashCode(c.session_id,code);
  const {data:reserved,error:reservationError}=await db.rpc("mednest_staff_stepup_reserve",{
   p_user_id:user.id,p_session_id:c.session_id,p_hash:digest
  });
  if(reservationError)return json(origin,503,{error:"Unable to reserve verification challenge"});
  if(reserved==="already_verified")return json(origin,200,{already_verified:true,message:"Your sensitive-action authorization is already active."});
  if(reserved==="throttled")return json(origin,429,{error:"Please allow at least 90 seconds before requesting another code"});
  if(reserved==="daily_limit")return json(origin,429,{error:"Daily security email limit reached"});
  if(reserved!=="reserved")return json(origin,403,{error:"This staff session is not authorized"});
  try{
   const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
    "authorization":"Bearer "+RESEND,"content-type":"application/json"
   },body:JSON.stringify({
    from:SENDER,to:[user.email],subject:"SJN MedNest — Sensitive Management Action Verification",
    text:"Your SJN MedNest Management Panel verification code is: "+code+
     "\n\nThis code expires in 10 minutes. Once verified, sensitive actions are authorized for 30 minutes in this signed-in session. If you did not request this email, ignore it. Never share the code."
   })});
   if(!res.ok)return json(origin,503,{error:"Security email delivery failed. Please check the staff email sender configuration."});
   return json(origin,200,{sent:true,message:"An eight-digit security code was sent to your verified email address."});
  }catch{return json(origin,503,{error:"Security email delivery is temporarily unavailable"})}
 }
 if(typeof body.code!=="string"||!/^\d{8}$/.test(body.code))
  return json(origin,400,{error:"Enter your eight-digit email security code"});
 const {data:result,error:verifyError}=await db.rpc("mednest_staff_stepup_verify",{
  p_user_id:user.id,p_session_id:c.session_id,p_hash:await hashCode(c.session_id,body.code)
 });
 if(verifyError)return json(origin,503,{error:"Verification temporarily unavailable"});
 if(result==="verified"){
  const {data:state,error:sError}=await db.from("mednest_staff_stepup").select("verified_until")
   .eq("user_id",user.id).eq("session_id",c.session_id).single();
  if(sError)return json(origin,503,{error:"Verification succeeded; refresh your security status"});
  return json(origin,200,{verified:true,expires_at:state.verified_until,message:"Sensitive operations are authorized for 30 minutes in this staff session."});
 }
 if(result==="invalid")return json(origin,400,{error:"Incorrect code. Please check your email and try again."});
 if(result==="expired")return json(origin,410,{error:"This security code expired or exceeded five attempts. Request a fresh code."});
 return json(origin,403,{error:"Security authorization denied"});
});
