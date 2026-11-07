// SJN MedNest Management Panel - session-bound email authorization for Chief Admin
// Separate from student Auth, global SMTP, and initial staff email proof.
import {createClient} from "npm:@supabase/supabase-js@2.95.0";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const KEY=Deno.env.get("RESEND_API_KEY")||"";
const SENDER=Deno.env.get("MEDNEST_STAFF_EMAIL_FROM")||"SJN MedNest <onboarding@resend.dev>";
const PEPPER=Deno.env.get("MEDNEST_STAFF_EMAIL_PEPPER")||SERVICE;
const ORIGINS=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+)?-sjn1\.vercel\.app$/;
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
function respond(origin,status,body){return new Response(JSON.stringify(body),{status,headers:{
 "content-type":"application/json","cache-control":"no-store, private",
 "access-control-allow-origin":origin||"null","access-control-allow-headers":"authorization,apikey,content-type,x-client-info",
 "access-control-allow-methods":"POST,OPTIONS","vary":"Origin"
}})}
const uuid=x=>typeof x==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
function parse(token){try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}
async function digest(session,code){
 const enc=new TextEncoder(),secret=enc.encode("sjn-mednest-staff-stepup-v1:"+PEPPER);
 const key=await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const bytes=await crypto.subtle.sign("HMAC",key,enc.encode(session+":"+code));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function code8(){
 const bytes=new Uint32Array(1),lim=Math.floor(4294967296/100000000)*100000000;
 do{crypto.getRandomValues(bytes)}while(bytes[0]>=lim);
 return String(bytes[0]%100000000).padStart(8,"0");
}
Deno.serve(async req=>{
 const origin=req.headers.get("Origin")||"";
 if(!ORIGINS.test(origin))return respond("",403,{error:"Origin not authorized"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS",
  "access-control-allow-headers":"authorization,apikey,content-type,x-client-info","vary":"Origin"
 }});
 if(req.method!=="POST")return respond(origin,405,{error:"Method not allowed"});
 if(!URL||!SERVICE)return respond(origin,503,{error:"Staff security unavailable"});
 const header=req.headers.get("Authorization")||"";
 if(!/^Bearer [A-Za-z0-9._-]+$/.test(header))return respond(origin,401,{error:"Sign in required"});
 const jwt=header.slice(7),claims=parse(jwt);
 if(!claims||!uuid(claims.session_id))return respond(origin,401,{error:"Invalid session"});
 const {data:auth,error:authError}=await db.auth.getUser(jwt);
 if(authError||!auth?.user?.id||auth.user.id!==claims.sub)return respond(origin,401,{error:"Invalid authentication"});
 const user=auth.user,session=claims.session_id;
 const {data:member,error:memberError}=await db.from("mednest_management_members")
  .select("technical_role,status,email").eq("user_id",user.id).maybeSingle();
 if(memberError)return respond(origin,503,{error:"Unable to check staff security"});
 if(!member||member.technical_role!=="chief_admin"||member.status!=="active"||
    member.email!==(user.email||"").toLowerCase())
  return respond(origin,403,{error:"Chief Admin authorization required"});
 let payload={};try{payload=await req.json()}catch{return respond(origin,400,{error:"Invalid request"})}
 if(!["status","send","verify"].includes(payload?.action))return respond(origin,400,{error:"Invalid action"});
 if(payload.action==="status"){
  const {data,error}=await db.from("mednest_management_stepup")
    .select("verified_until").eq("user_id",user.id).eq("session_id",session).maybeSingle();
  if(error)return respond(origin,503,{error:"Security status unavailable"});
  const valid=Boolean(data?.verified_until&&new Date(data.verified_until)>new Date());
  return respond(origin,200,{verified:valid,expires_at:valid?data.verified_until:null,configured:Boolean(KEY&&SENDER)});
 }
 if(!KEY||!SENDER||PEPPER.length<32)return respond(origin,503,{error:"Staff email security sender is not configured"});
 if(payload.action==="send"){
  const code=code8(),hash=await digest(session,code);
  const {data:reserved,error}=await db.rpc("mednest_reserve_management_stepup",{
    p_user_id:user.id,p_session_id:session,p_hash:hash
  });
  if(error)return respond(origin,503,{error:"Unable to prepare email security challenge"});
  if(reserved==="throttled")return respond(origin,429,{error:"Security code requested recently. Please try later."});
  if(reserved==="daily_limit")return respond(origin,429,{error:"Daily security email limit reached"});
  if(reserved!=="reserved")return respond(origin,403,{error:"Session is not authorized"});
  try{
    const sent=await fetch("https://api.resend.com/emails",{
      method:"POST",headers:{"authorization":"Bearer "+KEY,"content-type":"application/json"},
      body:JSON.stringify({from:SENDER,to:[user.email],subject:"SJN MedNest — Confirm Chief Admin Action",
       text:"Your SJN MedNest Management Panel security code is: "+code+
       "\n\nExpires in 10 minutes. Enter this code only in the Management Panel. Never share it."})
    });
    if(!sent.ok)return respond(origin,503,{error:"Email security code could not be delivered. Check sender configuration."});
  }catch{return respond(origin,503,{error:"Email delivery temporarily unavailable"})}
  return respond(origin,200,{sent:true,message:"Check your email for the eight-digit security code."});
 }
 if(typeof payload.code!=="string"||!/^\d{8}$/.test(payload.code))
   return respond(origin,400,{error:"Enter an eight-digit security code"});
 const {data:result,error}=await db.rpc("mednest_verify_management_stepup",{
   p_user_id:user.id,p_session_id:session,p_hash:await digest(session,payload.code)
 });
 if(error)return respond(origin,503,{error:"Unable to complete security verification"});
 if(result==="verified")return respond(origin,200,{verified:true,message:"Email confirmed. Sensitive staff-access changes are authorized for 30 minutes in this session."});
 if(result==="invalid")return respond(origin,400,{error:"Incorrect security code"});
 if(result==="expired")return respond(origin,410,{error:"Code expired or verification attempts exhausted"});
 return respond(origin,403,{error:"Security authorization unavailable"});
});
