// Management-only verified email proof. Does not alter Supabase Auth global settings.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
const URL=Deno.env.get("SUPABASE_URL")||"";
const ROLE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const PUBLISH=Deno.env.get("SUPABASE_ANON_KEY")||"";
const RESEND_KEY=Deno.env.get("RESEND_API_KEY")||"";
const FROM=Deno.env.get("MEDNEST_STAFF_EMAIL_FROM")||"";
const PEPPER=Deno.env.get("MEDNEST_STAFF_EMAIL_PEPPER")||"";
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+)?-sjn1\.vercel\.app$/;
const db=createClient(URL,ROLE,{auth:{persistSession:false,autoRefreshToken:false}});
function respond(origin,status,payload){
 return new Response(JSON.stringify(payload),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":origin||"null","access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"authorization,apikey,content-type,x-client-info","vary":"Origin"}});
}
function configured(){return Boolean(RESEND_KEY && FROM && PEPPER.length>=32 && URL && ROLE && PUBLISH);}
async function hashCode(code){
 const encoder=new TextEncoder();
 const k=await crypto.subtle.importKey("raw",encoder.encode(PEPPER),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const h=await crypto.subtle.sign("HMAC",k,encoder.encode(code));
 return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function code8(){
 const ar=new Uint32Array(1),limit=Math.floor(4294967296/100000000)*100000000;
 do{crypto.getRandomValues(ar)}while(ar[0]>=limit);
 return String(ar[0]%100000000).padStart(8,"0");
}
Deno.serve(async req=>{
 const origin=req.headers.get("Origin")||"";
 if(!ORIGIN.test(origin))return respond("",403,{error:"Origin not authorized"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"authorization,apikey,content-type,x-client-info","vary":"Origin"}});
 if(req.method!=="POST")return respond(origin,405,{error:"Method not allowed"});
 const bearer=req.headers.get("Authorization")||"";
 if(!/^Bearer [A-Za-z0-9._-]+$/.test(bearer))return respond(origin,401,{error:"Sign in required"});
 if(!URL||!ROLE)return respond(origin,503,{error:"Service configuration unavailable"});
 const {data:verified,error:authError}=await db.auth.getUser(bearer.slice(7));
 if(authError||!verified?.user?.id)return respond(origin,401,{error:"Valid session required"});
 const user=verified.user,email=(user.email||"").toLowerCase();
 // Independent proof is required because project-level email auto-confirmation
 // was already enabled for students; do not trust email_confirmed_at here.
 const {data:staff,error:staffError}=await db.from("mednest_management_members").select("user_id,email,technical_role,status").eq("user_id",user.id).maybeSingle();
 if(staffError)return respond(origin,503,{error:"Unable to read protected staff state"});
 let eligible=false;
 if(staff && staff.status==="invited" && staff.email===email && staff.technical_role==="member")eligible=true;
 if(!staff){
   const {data:approval,error:approvalError}=await db.from("mednest_management_bootstrap_approvals")
     .select("user_id").eq("user_id",user.id).eq("approved_email",email).is("verified_at",null).maybeSingle();
   if(approvalError)return respond(origin,503,{error:"Unable to verify approved bootstrap identity"});
   if(!approval)return respond(origin,403,{error:"Account is not approved for staff onboarding"});
   const {count,error:e}=await db.from("mednest_management_members").select("user_id",{head:true,count:"exact"}).eq("technical_role","chief_admin");
   if(e)return respond(origin,503,{error:"Unable to verify Chief Admin state"});
   eligible=count===0;
 }
 if(!eligible)return respond(origin,403,{error:"Account is not eligible for management onboarding"});
 let body={};try{body=await req.json();}catch(_){return respond(origin,400,{error:"Invalid request"})}
 if(!body || !["status","send","verify"].includes(body.action))return respond(origin,400,{error:"Invalid verification operation"});
 if(body.action==="status")return respond(origin,200,{eligible:true,configured:configured(),email});
 if(!configured())return respond(origin,503,{error:"Secure management-only email delivery is not configured yet. No changes were made to Student LMS email settings."});
 if(body.action==="send"){
   const {data:previous,error:existingError}=await db.from("mednest_management_email_challenges")
     .select("sent_at,day_bucket,day_count,verified_at").eq("user_id",user.id).maybeSingle();
   if(existingError)return respond(origin,503,{error:"Verification temporarily unavailable"});
   const now=Date.now(),today=new Date(now).toISOString().slice(0,10);
   if(previous){
     if(previous.verified_at)return respond(origin,409,{error:"This account has already completed email proof"});
     if(now-new Date(previous.sent_at).getTime()<90000)return respond(origin,429,{error:"A code was recently requested. Try again later."});
     if(previous.day_bucket===today && previous.day_count>=5)return respond(origin,429,{error:"Daily verification email limit reached"});
   }
   const otp=code8(),digest=await hashCode(otp);
   const record={
     user_id:user.id,email,code_hash:digest,sent_at:new Date(now).toISOString(),
     expires_at:new Date(now+10*60*1000).toISOString(),attempt_count:0,
     day_bucket:today,day_count:previous?.day_bucket===today?previous.day_count+1:1,
     verified_at:null,updated_at:new Date(now).toISOString()
   };
   const {error:saveError}=await db.from("mednest_management_email_challenges").upsert(record,{onConflict:"user_id"});
   if(saveError)return respond(origin,503,{error:"Unable to prepare verification"});
   // Custom provider: never change global Supabase Auth SMTP or confirmation settings.
   try{
     const mail=await fetch("https://api.resend.com/emails",{
       method:"POST",headers:{"authorization":"Bearer "+RESEND_KEY,"content-type":"application/json"},
       body:JSON.stringify({from:FROM,to:[email],subject:"SJN MedNest Management — Verify your email",
         text:"Your SJN MedNest Management Panel verification code is: "+otp+
         "\n\nThis code expires after 10 minutes. Never share it with anyone. If you did not request it, ignore this email."})
     });
     if(!mail.ok)return respond(origin,503,{error:"Verification email could not be delivered. Check the private mail-provider configuration."});
   }catch(_){return respond(origin,503,{error:"Unable to reach the email-delivery provider"})}
   return respond(origin,200,{sent:true,message:"Check your email for an eight-digit verification code."});
 }
 const code=typeof body.code==="string"?body.code:"";
 if(!/^\d{8}$/.test(code))return respond(origin,400,{error:"Enter an eight-digit code"});
 const digest=await hashCode(code);
 const {data:outcome,error:rpcError}=await db.rpc("mednest_complete_staff_email_verification",{p_user_id:user.id,p_code_hash:digest});
 if(rpcError)return respond(origin,503,{error:"Unable to complete account verification"});
 if(outcome==="verified")return respond(origin,200,{verified:true,message:"Email ownership verified. Complete authenticator security to enter the Management Panel."});
 if(outcome==="invalid")return respond(origin,400,{error:"Incorrect verification code"});
 if(outcome==="expired")return respond(origin,410,{error:"Verification code expired or attempts exhausted. Request a new code if eligible."});
 return respond(origin,403,{error:"Unable to authorize this account"});
});
