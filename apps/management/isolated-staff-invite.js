"use strict";
// Recipient-first invite review prototype. No new accounts or membership writes until
// the independently reviewed onboarding release is enabled.
// Invitation tokens live ONLY in memory: never localStorage, query params or logs.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL="https://tdqbjhrmfluiinntmjfh.supabase.co";
const KEY="sb_publishable_Redb-pOjNOSpDKg1uIbUBg_-PUCt5XX";
const ACTIONS=URL+"/functions/v1/mednest-isolated-team-actions";
const client=createClient(URL,KEY,{auth:{
 autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,
 storageKey:"sjn-mednest-isolated-staff-v1"
}});
const REGISTRATION_ENABLED=false;
const ACCEPTANCE_ENABLED=false;
const $=id=>document.getElementById(id);
let inviteToken=null;
const alert=(message,error=false,success=false)=>{
 const el=$("invite-status");el.textContent=message;el.dataset.error=String(error);
 el.dataset.success=String(success);
};
function receiveToken(){
 const hash=window.location.hash;
 const m=hash.match(/^#invite=([a-f0-9]{64})$/i);
 window.history.replaceState(null,"",window.location.pathname);
 if(!m){alert("This private invitation link is missing or invalid. Request a fresh invitation from the Chief Administrator.",true);return false}
 inviteToken=m[1].toLowerCase();return true;
}
async function call(action,details){
 if(!inviteToken)throw Error("Valid invitation link required");
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session?.access_token)throw Error("Sign in to your verified management account");
 const response=await fetch(ACTIONS,{
  method:"POST",credentials:"omit",cache:"no-store",
  headers:{"content-type":"application/json","apikey":KEY,
   authorization:"Bearer "+session.access_token},
  body:JSON.stringify({action,...details})
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||"Invitation temporarily unavailable");
 return result;
}
async function showInvitation(){
 $("invite-review").hidden=true;
 $("invite-signin").hidden=true;
 if(!inviteToken)return;
 const {data:{session}}=await client.auth.getSession();
 if(!session){
  $("invite-signin").hidden=false;
  alert("Sign in using the confirmed management email address that received your invitation.");
  return;
 }
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.email_confirmed_at){
  alert("Please confirm your management email before reviewing an invitation.",true);
  $("invite-signin").hidden=false;return;
 }
 try{
  const info=await call("invite.preview",{token:inviteToken});
  const inv=info.invitation;
  $("invite-recipient").textContent=inv.email;
  $("invite-display-name").textContent=inv.display_name||"Not specified";
  $("invite-title").textContent=inv.organizational_title||"Not specified";
  $("invite-expires").textContent=new Date(inv.expires_at).toLocaleString();
  $("invite-review").hidden=false;
  $("accept-invitation").disabled=!(ACCEPTANCE_ENABLED&&info.acceptance_enabled);
  $("invite-gate-message").textContent=info.acceptance_enabled&&ACCEPTANCE_ENABLED
   ?"Confirm that you wish to accept your personal invitation."
   :"Invitation acceptance is locked until the separate onboarding security review is complete.";
  alert("The invitation matches your verified staff email. Review the information below.",false,true);
 }catch(e){
  alert(e.message,true);
  $("invite-signin").hidden=false;
 }
}
$("staff-signin-form").addEventListener("submit",async event=>{
 event.preventDefault();
 if(!inviteToken)return;
 const button=event.currentTarget.querySelector('button[type="submit"]');
 button.disabled=true;
 try{
  const email=$("staff-signin-email").value.trim().toLowerCase();
  const {error}=await client.auth.signInWithPassword({email,password:$("staff-signin-password").value});
  $("staff-signin-password").value="";
  if(error)throw Error("Management sign-in was not accepted");
  await showInvitation();
 }catch(e){alert(e.message,true)}
 finally{button.disabled=false}
});
$("staff-signup-form").addEventListener("submit",event=>{
 event.preventDefault();
 alert("New management registration is not enabled yet. Ask Chief Administrator for a new invitation after activation.",true);
});
$("accept-invitation").addEventListener("click",async()=>{
 // Intentionally unreachable until separate activation and recipient acceptance UAT.
 if(!ACCEPTANCE_ENABLED)return;
 const button=$("accept-invitation");button.disabled=true;
 try{
  const result=await call("invite.accept",{token:inviteToken});
  if(result.accepted){
   inviteToken=null;$("invite-review").hidden=true;
   alert("Invitation accepted. Sign in from the Management Panel.",false,true);
  }
 }catch(e){alert(e.message,true)}
 finally{button.disabled=false}
});
$("invite-signout").addEventListener("click",async()=>{
 await client.auth.signOut({scope:"local"});
 $("invite-review").hidden=true;
 $("invite-recipient").textContent="";
 $("invite-display-name").textContent="";
 $("invite-title").textContent="";
 $("invite-expires").textContent="";
 await showInvitation();
});
document.querySelector(".invite-register").hidden=!REGISTRATION_ENABLED;
if(receiveToken())await showInvitation();
