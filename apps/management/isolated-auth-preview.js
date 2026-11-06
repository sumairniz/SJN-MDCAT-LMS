"use strict";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
// Explicitly isolated from existing student/management Auth sessions and DB.
const URL="https://tdqbjhrmfluiinntmjfh.supabase.co";
const KEY="sb_publishable_Redb-pOjNOSpDKg1uIbUBg_-PUCt5XX";
const API=URL+"/functions/v1/mednest-isolated-auth";
// Stable, deployment-protected branch alias: never redirect verification to localhost.
const EMAIL_CONFIRM_REDIRECT="https://sjn-mednest-management-git-sjn-phase1a-foundation-sjn1.vercel.app/isolated-auth-preview.html";
const client=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,
 detectSessionInUrl:true,storageKey:"sjn-mednest-isolated-staff-v1"}});
const $=id=>document.getElementById(id);
let active=false;
const status=(message,error=false)=>{const el=$("auth-status");el.textContent=message;el.dataset.error=String(error)};
async function api(action,fields={}){
 const {data:{session}}=await client.auth.getSession();
 if(!session?.access_token)throw Error("Sign in to the isolated management account first.");
 const r=await fetch(API,{method:"POST",cache:"no-store",credentials:"omit",headers:{
  "apikey":KEY,"content-type":"application/json","authorization":"Bearer "+session.access_token
 },body:JSON.stringify({action,...fields})});
 const data=await r.json().catch(()=>({error:"Unable to read management verification response"}));
 if(!r.ok)throw Error(data.error||"Staff authentication rejected");
 return data;
}
function fill(member){
 active=true;$("signed-out").hidden=true;$("signed-in").hidden=false;
 $("profile-email").textContent=member.email;
 $("profile-state").textContent=member.status;
 $("display-name").value=member.display_name||"";
 $("organization-title").value=member.organizational_title||"";
}
async function load(){
 try{const data=await api("me");if(data.member?.role!=="chief_admin")throw Error("Chief Administrator approval required");fill(data.member);status("Isolated staff identity verified.");}
 catch(e){active=false;$("signed-out").hidden=false;$("signed-in").hidden=true;status(e.message,true)}
}
$("identity-form").addEventListener("submit",async event=>{
 event.preventDefault();const button=$("signin-btn");button.disabled=true;status("Checking independent management credentials…");
 try{
  const email=$("staff-email").value.trim().toLowerCase(),password=$("staff-password").value;
  const {error}=await client.auth.signInWithPassword({email,password});
  $("staff-password").value="";
  if(error)throw Error("Sign In failed. Check the password and confirm email verification if this is the first login.");
  await load();
 }catch(e){status(e.message,true)}finally{button.disabled=false}
});
$("setup-btn").addEventListener("click",async()=>{
 const email=$("staff-email").value.trim().toLowerCase(),password=$("staff-password").value;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12){
  status("Enter your already approved email and a new private password containing at least 12 characters.",true);return;
 }
 $("setup-btn").disabled=true;status("Creating independent authentication identity…");
 try{
  const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:EMAIL_CONFIRM_REDIRECT}});
  $("staff-password").value="";
  if(error)throw Error("Account setup failed. Confirm whether the new-project email service is configured.");
  if(data.session){await load();return}
  status("Setup request received. Confirm the email from the new Auth project, then return here and use Sign In. Your old Management Panel account is unchanged.");
 }catch(e){status(e.message,true)}finally{$("setup-btn").disabled=false}
});
$("profile-form").addEventListener("submit",async event=>{
 event.preventDefault();status("Saving protected profile…");
 try{
  const r=await api("profile.update",{display_name:$("display-name").value.trim()||null,
   organizational_title:$("organization-title").value.trim()||null});
  if(!r.success)throw Error("Save not confirmed");
  fill(r.member);status("Profile saved with protected audit record.");
 }catch(e){status(e.message,true)}
});
$("signout-btn").addEventListener("click",async()=>{
 await client.auth.signOut({scope:"local"});
 active=false;$("signed-in").hidden=true;$("signed-out").hidden=false;
 $("staff-password").value="";status("Signed out of the independent management account.");
});
// Display a useful message for reused/expired links without exposing token fragments.
const callbackHash=window.location.hash.startsWith("#error=")?new URLSearchParams(window.location.hash.slice(1)):null;
if(callbackHash){
 const code=callbackHash.get("error_code")||"verification_failed";
 window.history.replaceState(null,"",window.location.pathname+window.location.search);
 status(code==="otp_expired"
  ?"This email confirmation link was already used or has expired. If you already confirmed your email, use Sign In with your existing password."
  :"Email confirmation could not be completed. If you already confirmed, use Sign In; otherwise request a fresh confirmation link.",true);
}
const {data:{session}}=await client.auth.getSession();
if(session)await load();
