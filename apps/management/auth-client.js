"use strict";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL="https://aozknkrwafowsrehdwlr.supabase.co", KEY="sb_publishable_9CjKnd4hEIIvS7OXvTq_aA_tTkLsBts", API=URL+"/functions/v1/mednest-management";
const PERMS=Object.freeze({
"content.view":"View academic content","content.create":"Create MCQs","content.edit":"Edit MCQs","content.import":"Bulk import MCQs","content.review":"Review questions","content.publish":"Publish questions","content.archive":"Archive questions","taxonomy.manage":"Manage chapters and topics","pastpapers.manage":"Manage past papers","courses.manage":"Manage course sessions","courses.publish":"Publish courses","resources.manage":"Manage Academy Resources","students.view":"View student performance","students.details":"View student details","students.create":"Create student accounts","students.suspend":"Suspend students","enrollments.grant":"Grant course enrollment","enrollments.revoke":"Revoke course enrollment","access.change":"Change whole-feature access","reports.view":"View reports","reports.resolve":"Resolve reports","analytics.view":"View analytics","audit.view":"View activity log","finance.verify":"Verify payments","announcements.manage":"Manage announcements"});
const client=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:"sjn-mednest-staff-session-v1"}});
const $=id=>document.getElementById(id);
let staff=null,authorized=false,doing=false,factor=null,editing=null;
function show(id,yes){$(id).classList.toggle("is-hidden",!yes)}
function report(id,message,isError=false){$(id).textContent=message||"";$(id).dataset.error=String(isError)}
function el(tag,className,value){const e=document.createElement(tag);if(className)e.className=className;if(value!==undefined)e.textContent=String(value);return e}
async function request(action,fields={}){
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session?.access_token)throw Error("Authenticated staff session required");
 const resp=await fetch(API,{method:"POST",cache:"no-store",credentials:"omit",
  headers:{"authorization":"Bearer "+session.access_token,"apikey":KEY,"content-type":"application/json"},
  body:JSON.stringify({action,...fields})});
 const result=await resp.json().catch(()=>{throw Error("Invalid management server response")});
 if(!resp.ok)throw Error(result?.error||"Management request failed");
 return result;
}
function fillProfile(member){
 staff=member;
 $("member-profile-name").textContent=member.display_name||"Management Team Member";
 $("member-profile-title").textContent=member.organizational_title||"No organizational title";
 $("member-profile-email").textContent=member.email||"—";
 $("member-profile-role").textContent=member.role==="chief_admin"?"Chief Admin":"Management Team Member";
 $("member-profile-status").textContent=(member.status||"active").toUpperCase();
 $("member-profile-account-status").textContent=member.status||"—";
 const area=$("member-permissions-list");area.replaceChildren();
 const rights=member.role==="chief_admin"?[["Chief Admin","All permissions; exclusive staff access management"]]:
   (member.permissions||[]).map(code=>[PERMS[code]||code,code]);
 if(!rights.length){area.append(el("p","secondary-note","No operational permissions assigned"));return}
 for(const [title,desc] of rights){const row=el("div","staff-row"),left=el("div");left.append(el("strong","",title),el("p","",desc));row.append(left);area.append(row)}
}
function buildChoices(where,selected=[]){
 const area=$(where);area.replaceChildren();
 for(const [code,label] of Object.entries(PERMS)){
  const row=el("label"),check=el("input");check.type="checkbox";check.value=code;check.checked=selected.includes(code);
  row.append(check,el("span","",label));area.append(row);
 }
}
function checked(where){return [...$(where).querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value)}
function mfaScreen(id,setup=null){
 factor=id;show("mfa-panel",true);show("management-signin",false);show("mfa-enrollment",!!setup);
 $("mfa-qr").hidden=!setup;
 if(setup){$("mfa-qr").src=setup.totp?.qr_code||"";$("mfa-secret").textContent=setup.totp?.secret||""}
 else{$("mfa-qr").removeAttribute("src");$("mfa-secret").textContent=""}
 $("mfa-guidance").textContent=setup?"Add the account to an authenticator app and verify the code.":"Enter the current six-digit code from your authenticator app.";
 $("mfa-code").value="";$("mfa-code").focus();
}
async function startMfa(){
 const {data,error}=await client.auth.mfa.listFactors();
 if(error)throw Error("Unable to check authenticator factors");
 const factor=(data?.totp||[]).find(x=>x.status==="verified");
 if(factor){mfaScreen(factor.id);return}
 const setup=await client.auth.mfa.enroll({factorType:"totp",friendlyName:"SJN MedNest Management"});
 if(setup.error||!setup.data?.id)throw Error("Unable to set up authenticator");
 mfaScreen(setup.data.id,setup.data);
}
async function checkSession(){
 const {data:{session}}=await client.auth.getSession();
 if(!session?.access_token){staff=null;authorized=false;show("management-signin",true);show("mfa-panel",false);return}
 const data=await request("me");
 if(!data?.member?.id)throw Error("Account not authorized for management");
 if(data.mfa_required){staff=data.member;await startMfa();return}
 show("management-signin",true);show("mfa-panel",false);fillProfile(data.member);
 if(!authorized){authorized=true;window.dispatchEvent(new Event("mednest:authorized"))}
 else await refreshModule();
}
async function signOut(){
 try{await client.auth.signOut({scope:"local"})}catch(_){}
 staff=null;authorized=false;factor=null;editing=null;
 show("management-signin",true);show("mfa-panel",false);
 $("password").value="";$("mfa-code").value="";
 window.dispatchEvent(new Event("mednest:signed-out"));
}
function toggleChiefSetup(open){
 show("chief-setup-panel",open);
 show("management-signin",!open);
 show("first-chief-toggle",!open);
 $("first-chief-toggle").setAttribute("aria-expanded",String(open));
 report("auth-feedback","");
 if(open)$("chief-email").focus();
 else{$("chief-password").value="";$("chief-confirm-password").value="";$("email").focus()}
}
async function registerInitialChief(event){
 event.preventDefault();if(doing)return;
 const email=$("chief-email").value.trim().toLowerCase(),password=$("chief-password").value;
 if(password.length<12||password!==$("chief-confirm-password").value){
  report("chief-setup-feedback","Passwords must match and be at least 12 characters.",true);return;
 }
 doing=true;$("chief-setup-submit").disabled=true;
 report("chief-setup-feedback","Requesting email verification…");
 try{
  // This creates only an Auth identity. Only a separately reviewed, verified
  // Auth UUID/email may later receive the protected Chief Admin membership.
  const {data,error}=await client.auth.signUp({
   email,password,options:{emailRedirectTo:window.location.origin+"/"}
  });
  if(error)throw Error("Unable to start account setup. Verify details and try later.");
  if(data?.session)await client.auth.signOut({scope:"local"});
  report("chief-setup-feedback","If a confirmation email was sent, open it and verify your address. Then return to the Management Panel. Chief Admin access is assigned separately after verification; no Student LMS registration is needed.");
 }catch(e){report("chief-setup-feedback",e.message||"Account setup unavailable",true)}
 finally{
  $("chief-password").value="";$("chief-confirm-password").value="";
  doing=false;$("chief-setup-submit").disabled=false;
 }
}
async function signIn(event){
 event.preventDefault();if(doing)return;doing=true;$("signin-submit").disabled=true;
 report("auth-feedback","Verifying management credentials…");
 try{
  const email=$("email").value.trim().toLowerCase(),password=$("password").value;
  const {error}=await client.auth.signInWithPassword({email,password});$("password").value="";
  if(error)throw Error("Sign In failed. Check the supplied credentials.");
  await checkSession();report("auth-feedback",authorized?"Management account verified.":"Additional security verification required.");
 }catch(e){await signOut();report("auth-feedback",e.message||"Sign In failed",true)}
 finally{doing=false;$("signin-submit").disabled=false}
}
async function verifyMfa(event){
 event.preventDefault();if(doing||!factor)return;doing=true;$("mfa-submit").disabled=true;
 try{
  const code=$("mfa-code").value.trim();if(!/^\d{6}$/.test(code))throw Error("Enter a six-digit code.");
  const {error}=await client.auth.mfa.challengeAndVerify({factorId:factor,code});
  if(error)throw Error("Authenticator verification failed");
  await client.auth.refreshSession();factor=null;await checkSession();report("auth-feedback","");
 }catch(e){report("auth-feedback",e.message||"MFA failed",true)}
 finally{doing=false;$("mfa-submit").disabled=false}
}
function renderMembers(members){
 const area=$("team-directory-list");area.replaceChildren();
 $("team-total").textContent=members.length;
 $("team-active").textContent=members.filter(x=>x.status==="active").length;
 $("team-invited").textContent=members.filter(x=>x.status==="invited").length;
 if(!members.length){area.append(el("p","secondary-note","No team members available"));return}
 for(const m of members){
  const row=el("div","staff-row"),left=el("div");
  left.append(el("strong","",m.display_name||m.email),el("p","",m.email+" · "+(m.role==="chief_admin"?"Chief Admin":"Management Team Member")+" · "+m.status));
  if(m.organizational_title)left.append(el("p","",m.organizational_title));
  row.append(left);
  if(m.role!=="chief_admin"){
    const btn=el("button","","Manage access");btn.type="button";btn.addEventListener("click",()=>editMember(m));row.append(btn);
  }
  area.append(row);
 }
}
function editMember(member){
 editing=member;$("edit-member-heading").textContent="Edit: "+(member.display_name||member.email);
 $("edit-member-status").value=member.status;$("edit-member-name").value=member.display_name||"";
 $("edit-member-title").value=member.organizational_title||"";
 buildChoices("edit-member-permissions",member.permissions||[]);
 show("team-edit-form",true);show("team-invite-form",false);
 $("team-edit-form").scrollIntoView({block:"nearest",behavior:"smooth"});
}
async function teamList(){
 show("team-invite-show",staff?.role==="chief_admin");
 if(staff?.role!=="chief_admin"){
  $("team-directory-list").replaceChildren(el("p","secondary-note","Only Chief Admin can manage staff access."));
  return;
 }
 try{const data=await request("team.list");renderMembers(data.members||[])}
 catch(e){report("team-feedback",e.message,true)}
}
async function auditList(){
 const box=$("audit-event-list");box.replaceChildren(el("p","secondary-note","Loading activity…"));
 try{
  const data=await request("audit.list");box.replaceChildren();
  if(!data.events?.length){box.append(el("p","secondary-note","No staff activity recorded."));return}
  for(const record of data.events){
    const row=el("div","staff-row"),left=el("div");
    left.append(el("strong","",record.action),el("p","",new Date(record.created_at).toLocaleString()+" · Actor ID: "+record.actor_user_id));
    row.append(left);box.append(row);
  }
 }catch(e){box.replaceChildren(el("p","auth-feedback",e.message))}
}
async function refreshModule(){
 const name=document.querySelector('.nav-item[aria-current="page"]')?.dataset.module;
 if(name==="team")await teamList();if(name==="reports")await auditList();
}
async function invite(event){
 event.preventDefault();if(staff?.role!=="chief_admin")return;
 const submit=$("team-invite-form").querySelector('button[type="submit"]');submit.disabled=true;
 try{
  await request("team.invite",{email:$("invite-email").value.trim(),
   display_name:$("invite-name").value.trim(),organizational_title:$("invite-title").value.trim(),
   permissions:checked("invite-permissions")});
  report("team-feedback","Team invitation created. The new member must verify the invitation and complete MFA.");
  show("team-invite-form",false);await teamList();
 }catch(e){report("team-feedback",e.message,true)}
 finally{submit.disabled=false}
}
async function saveMember(event){
 event.preventDefault();if(staff?.role!=="chief_admin"||!editing)return;
 const submit=$("team-edit-form").querySelector('button[type="submit"]');submit.disabled=true;
 try{
  await request("team.update",{user_id:editing.id,status:$("edit-member-status").value,
   display_name:$("edit-member-name").value.trim()||null,
   organizational_title:$("edit-member-title").value.trim()||null,
   permissions:checked("edit-member-permissions")});
  report("team-feedback","Staff member updated.");show("team-edit-form",false);editing=null;await teamList();
 }catch(e){report("team-feedback",e.message,true)}
 finally{submit.disabled=false}
}
$("management-signin").addEventListener("submit",signIn);
$("first-chief-toggle").addEventListener("click",()=>toggleChiefSetup(true));
$("first-chief-cancel").addEventListener("click",()=>toggleChiefSetup(false));
$("chief-setup-form").addEventListener("submit",registerInitialChief);
$("mfa-form").addEventListener("submit",verifyMfa);
$("mfa-cancel").addEventListener("click",signOut);
$("team-invite-show").addEventListener("click",()=>{buildChoices("invite-permissions");show("team-invite-form",true);show("team-edit-form",false)});
$("invite-cancel").addEventListener("click",()=>show("team-invite-form",false));
$("edit-member-cancel").addEventListener("click",()=>show("team-edit-form",false));
$("team-invite-form").addEventListener("submit",invite);
$("team-edit-form").addEventListener("submit",saveMember);
window.addEventListener("mednest:module",()=>{if(staff&&authorized)refreshModule()});
window.addEventListener("mednest:signout",signOut);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&authorized)checkSession().catch(()=>signOut())});
try{await checkSession()}catch(_){await signOut()}
