"use strict";
// SJN MedNest Management Panel: password sign-in + Chief Admin invitations,
// with server-verified, session-bound email approval for sensitive actions.
// No QR scanning, authenticator app, frontend role claims or student-LMS code.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL="https://aozknkrwafowsrehdwlr.supabase.co";
const KEY="sb_publishable_9CjKnd4hEIIvS7OXvTq_aA_tTkLsBts";
const API=URL+"/functions/v1/mednest-management";
const SECURITY=URL+"/functions/v1/mednest-management-stepup";
const client=createClient(URL,KEY,{auth:{
  autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,
  storageKey:"sjn-mednest-staff-session-v1"
}});
const PERMS=Object.freeze({
 "content.view":"View academic content","content.create":"Create MCQs","content.edit":"Edit MCQs",
 "content.import":"Bulk import MCQs","content.review":"Review questions",
 "content.publish":"Publish questions","content.archive":"Archive questions",
 "taxonomy.manage":"Manage chapters and topics","pastpapers.manage":"Manage past papers",
 "courses.manage":"Manage course sessions","courses.publish":"Publish courses",
 "resources.manage":"Manage Academy Resources","students.view":"View student performance",
 "students.details":"View student details","students.create":"Create student accounts",
 "students.suspend":"Suspend student accounts","enrollments.grant":"Grant course enrollment",
 "enrollments.revoke":"Revoke course enrollment","access.change":"Change whole-module access",
 "reports.view":"View reports","reports.resolve":"Resolve reports",
 "analytics.view":"View analytics","audit.view":"View activity log",
 "finance.verify":"Verify payment records","announcements.manage":"Manage announcements"
});
const $=id=>document.getElementById(id);
const visible=(id,on)=>$(id).classList.toggle("is-hidden",!on);
const notice=(id,message,error=false)=>{const element=$(id);element.textContent=message||"";element.dataset.error=String(error)};
const element=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
let staff=null,authorized=false,busy=false,editing=null,inviteToken=null,inviteDetails=null,existingInvite=false;
let pendingSensitive=null,invitationSenderReady=false;
function parseInviteFromUrl(){
 const match=window.location.hash.match(/^#invite=([a-f0-9]{64})$/i);
 if(!match)return null;
 window.history.replaceState(null,"",window.location.pathname+window.location.search);
 return match[1].toLowerCase();
}
async function call(endpoint,action,fields={},useAuth=true){
 const headers={"apikey":KEY,"content-type":"application/json"};
 if(useAuth){
  const {data:{session},error}=await client.auth.getSession();
  if(error||!session?.access_token)throw Error("Sign In required");
  headers.authorization="Bearer "+session.access_token;
 }
 let response;
 try{response=await fetch(endpoint,{method:"POST",cache:"no-store",credentials:"omit",
    headers,body:JSON.stringify({action,...fields})})}
 catch{throw Error("Unable to connect to the Management Panel security service")}
 const result=await response.json().catch(()=>({error:"Invalid management response"}));
 if(!response.ok){
  const e=new Error(result?.error||"Management request failed");
  e.status=response.status;e.stepupRequired=Boolean(result?.stepup_required);throw e;
 }
 return result;
}
const manage=(action,fields)=>call(API,action,fields);
const security=(action,fields)=>call(SECURITY,action,fields);
function fillProfile(m){
 staff=m;
 $("member-profile-name").textContent=m.display_name||"Management Team Member";
 $("member-profile-title").textContent=m.organizational_title||"No organizational title";
 $("member-profile-email").textContent=m.email||"—";
 $("member-profile-role").textContent=m.role==="chief_admin"?"Chief Admin":"Management Team Member";
 $("member-profile-status").textContent=(m.status||"active").toUpperCase();
 $("member-profile-account-status").textContent=m.status||"—";
 const box=$("member-permissions-list");box.replaceChildren();
 const rights=m.role==="chief_admin"
  ?[["Chief Admin","Full management privileges; staff changes require a recent email security approval"]]
  :(m.permissions||[]).map(x=>[PERMS[x]||x,x]);
 if(!rights.length){box.append(element("p","secondary-note","No operational permissions assigned"));return;}
 for(const [name,detail] of rights){
  const row=element("div","staff-row"),left=element("div");
  left.append(element("strong","",name),element("p","",detail));row.append(left);box.append(row);
 }
}
function buildChoices(id,selected=[]){
 const box=$(id);box.replaceChildren();
 for(const [code,label] of Object.entries(PERMS)){
  const row=element("label"),check=element("input");
  check.type="checkbox";check.value=code;check.checked=selected.includes(code);
  row.append(check,element("span","",label));box.append(row);
 }
}
function selectedChoices(id){return [...$(id).querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value)}
async function signOut(){
 try{await client.auth.signOut({scope:"local"})}catch(_){}
 staff=null;authorized=false;editing=null;pendingSensitive=null;
 $("password").value="";$("staff-stepup-code").value="";
 closeStepup();visible("staff-invitation-panel",false);visible("management-signin",true);
 window.dispatchEvent(new Event("mednest:signed-out"));
}
async function checkSession(){
 const {data:{session}}=await client.auth.getSession();
 if(!session?.access_token)return;
 const response=await manage("me");
 if(!response?.member?.id)throw Error("Not an authorized management member");
 fillProfile(response.member);
 if(!authorized){authorized=true;window.dispatchEvent(new Event("mednest:authorized"))}
}
async function signIn(event){
 event.preventDefault();if(busy)return;busy=true;$("signin-submit").disabled=true;
 notice("auth-feedback","Signing in securely…");
 try{
  const email=$("email").value.trim().toLowerCase(),password=$("password").value;
  const {error}=await client.auth.signInWithPassword({email,password});
  $("password").value="";
  if(error)throw Error("Incorrect email or password");
  await checkSession();notice("auth-feedback","");
 }catch(e){
  await signOut();
  notice("auth-feedback",e.message==="Not an authorized management member"?
    "This account has no Management Panel access. Ask Chief Admin to invite you.":e.message,true);
 }finally{busy=false;$("signin-submit").disabled=false}
}
async function loadInvitation(){
 if(!inviteToken)return;
 try{
  const data=await call(API,"invite.preview",{token:inviteToken},false);
  inviteDetails=data.invitation;
  $("invitation-email").value=inviteDetails.email;
  $("invitation-description").textContent=
    "You were invited to SJN MedNest Management Panel"+(inviteDetails.display_name?
      " as "+inviteDetails.display_name:"")+
    ". Use the exact invited email and choose a private password. No student registration is required.";
  visible("management-signin",false);visible("staff-invitation-panel",true);
  notice("invitation-feedback","Invitation valid until "+new Date(inviteDetails.expires_at).toLocaleString()+".");
  $("invitation-password").focus();
 }catch(e){
  inviteToken=null;visible("staff-invitation-panel",false);
  notice("auth-feedback",e.message,true);
 }
}
function toggleExistingAccount(){
 existingInvite=!existingInvite;
 visible("invitation-confirm-field",!existingInvite);
 $("invitation-password-confirm").required=!existingInvite;
 $("invitation-password").autocomplete=existingInvite?"current-password":"new-password";
 $("invitation-accept-submit").textContent=existingInvite?
  "Sign In & Accept Invitation":"Create Account & Accept Invitation";
 $("invitation-existing-toggle").textContent=existingInvite?
  "I need to create a new account":"I already have an account";
 notice("invitation-feedback",existingInvite?
  "Use the password of your existing account, which must match the invitation email.":
  "Create a new password. Your personal email invitation is your proof of access.");
}
async function acceptInvitation(event){
 event.preventDefault();if(busy||!inviteToken||!inviteDetails)return;
 busy=true;$("invitation-accept-submit").disabled=true;
 const email=inviteDetails.email,password=$("invitation-password").value;
 try{
  if(!existingInvite){
   if(password.length<12||password!==$("invitation-password-confirm").value)
    throw Error("New passwords must match and contain at least 12 characters.");
   const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/"}});
   if(error){
    if(error.status===422||error.code==="user_already_exists")
     throw Error("This email already has an account. Select 'I already have an account' and enter its password.");
    throw Error("Unable to create this authentication account.");
   }
   if(!data?.session)throw Error("Account created; check your email if a confirmation link is sent. Reopen the original invitation link and sign in to finish activation.");
  }else{
   const {error}=await client.auth.signInWithPassword({email,password});
   if(error)throw Error("Existing account sign-in failed. Check the email and password.");
  }
  $("invitation-password").value="";$("invitation-password-confirm").value="";
  const accepted=await manage("invite.accept",{token:inviteToken});
  if(!accepted.accepted)throw Error("Invitation not yet accepted");
  inviteToken=null;inviteDetails=null;
  visible("staff-invitation-panel",false);visible("management-signin",true);
  await checkSession();
 }catch(e){notice("invitation-feedback",e.message,true)}
 finally{busy=false;$("invitation-accept-submit").disabled=false}
}
function renderMembers(members){
 const area=$("team-directory-list");area.replaceChildren();
 $("team-total").textContent=members.length;
 $("team-active").textContent=members.filter(x=>x.status==="active").length;
 if(!members.length){area.append(element("p","secondary-note","No active management members"));return}
 for(const member of members){
  const row=element("div","staff-row"),left=element("div");
  left.append(element("strong","",member.display_name||member.email),
    element("p","",member.email+" · "+(member.role==="chief_admin"?"Chief Admin":"Management Team Member")+" · "+member.status));
  if(member.organizational_title)left.append(element("p","",member.organizational_title));
  row.append(left);
  if(member.role!=="chief_admin"){
   const edit=element("button","","Manage access");edit.type="button";
   edit.addEventListener("click",()=>openEdit(member));row.append(edit);
  }
  area.append(row);
 }
}
function renderInvitations(invitations){
 const box=$("pending-invitations-list");box.replaceChildren();
 $("team-invited").textContent=invitations.length;
 if(!invitations.length){box.append(element("p","secondary-note","No pending invitations"));return}
 for(const inv of invitations){
  const row=element("div","staff-row"),info=element("div");
  info.append(element("strong","",inv.display_name||inv.email),
   element("p","",inv.email+" · Expires "+new Date(inv.expires_at).toLocaleString()));
  row.append(info);
  const cancel=element("button","","Revoke invitation");cancel.type="button";
  cancel.addEventListener("click",()=>sensitive("team.revoke_invite",{invitation_id:inv.id},
   async()=>{notice("team-feedback","Invitation revoked.");await loadTeam()}));
  row.append(cancel);box.append(row);
 }
}
async function loadTeam(){
 visible("team-invite-show",staff?.role==="chief_admin");
 if(staff?.role!=="chief_admin"){
  $("team-directory-list").replaceChildren(element("p","secondary-note","Only Chief Admin can manage staff access."));
  $("pending-invitations-list").replaceChildren(element("p","secondary-note","Only Chief Admin can view pending invitations."));
  return;
 }
 try{
  const response=await manage("team.list");
  renderMembers(response.members||[]);
  renderInvitations(response.invitations||[]);
 }catch(e){notice("team-feedback",e.message,true)}
}
async function loadAudit(){
 const box=$("audit-event-list");box.replaceChildren(element("p","secondary-note","Loading activity…"));
 try{
  const result=await manage("audit.list");box.replaceChildren();
  if(!result.events?.length){box.append(element("p","secondary-note","No management activity recorded"));return}
  for(const event of result.events){
   const row=element("div","staff-row"),info=element("div");
   info.append(element("strong","",event.action),element("p","",new Date(event.created_at).toLocaleString()+" · Actor ID: "+event.actor_user_id));
   row.append(info);box.append(row);
  }
 }catch(e){box.replaceChildren(element("p","auth-feedback",e.message))}
}
async function refreshModule(){
 const m=document.querySelector('.nav-item[aria-current="page"]')?.dataset.module;
 if(m==="team")await loadTeam();if(m==="reports")await loadAudit();
}
function openEdit(m){
 editing=m;$("edit-member-heading").textContent="Edit: "+(m.display_name||m.email);
 $("edit-member-status").value=m.status;
 $("edit-member-name").value=m.display_name||"";
 $("edit-member-title").value=m.organizational_title||"";
 buildChoices("edit-member-permissions",m.permissions||[]);
 visible("team-edit-form",true);visible("team-invite-form",false);
 $("team-edit-form").scrollIntoView({behavior:"smooth",block:"nearest"});
}
function openStepup(){
 visible("staff-stepup-backdrop",true);
 $("staff-stepup-code").value="";
 notice("staff-stepup-status","A fresh email code is required to change staff access. Click Send Email Security Code.");
 $("staff-stepup-send").focus();
}
function closeStepup(){visible("staff-stepup-backdrop",false);$("staff-stepup-code").value=""}
async function sensitive(action,payload,onComplete){
 if(staff?.role!=="chief_admin"){notice("team-feedback","Chief Admin access required",true);return}
 try{
  const s=await security("status");
  if(!s.verified){
   pendingSensitive={action,payload,onComplete};
   openStepup();return;
  }
  await runSensitive(action,payload,onComplete);
 }catch(e){notice("team-feedback",e.message,true)}
}
async function runSensitive(action,payload,onComplete){
 try{
  const result=await manage(action,payload);
  await onComplete(result);
 }catch(e){
  if(e.stepupRequired){pendingSensitive={action,payload,onComplete};openStepup()}
  else notice("team-feedback",e.message,true);
 }
}
async function sendStepup(){
 $("staff-stepup-send").disabled=true;
 notice("staff-stepup-status","Sending a fresh security code…");
 try{
  const response=await security("send");
  notice("staff-stepup-status",response.message||"Security email sent");
 }catch(e){notice("staff-stepup-status",e.message,true)}
 finally{$("staff-stepup-send").disabled=false}
}
async function verifyStepup(event){
 event.preventDefault();$("staff-stepup-confirm").disabled=true;
 try{
  const code=$("staff-stepup-code").value.trim();
  if(!/^\d{8}$/.test(code))throw Error("Enter the eight-digit code");
  const data=await security("verify",{code});
  if(!data.verified)throw Error("Email security not confirmed");
  closeStepup();
  const pending=pendingSensitive;pendingSensitive=null;
  if(pending)await runSensitive(pending.action,pending.payload,pending.onComplete);
 }catch(e){notice("staff-stepup-status",e.message,true)}
 finally{$("staff-stepup-confirm").disabled=false;$("staff-stepup-code").value=""}
}
async function invite(event){
 event.preventDefault();
 const form=$("team-invite-form"),submit=form.querySelector('button[type="submit"]');
 submit.disabled=true;
 const payload={email:$("invite-email").value.trim(),
  display_name:$("invite-name").value.trim()||null,
  organizational_title:$("invite-title").value.trim()||null,
  permissions:selectedChoices("invite-permissions")};
 try{
  await sensitive("team.invite",payload,async()=>{
   notice("team-feedback","Invitation emailed. The recipient must accept the one-time link and create their own account.");
   form.reset();visible("team-invite-form",false);await loadTeam();
  });
 }finally{submit.disabled=false}
}
async function saveMember(event){
 event.preventDefault();if(!editing)return;
 const submit=$("team-edit-form").querySelector('button[type="submit"]');submit.disabled=true;
 const payload={user_id:editing.id,status:$("edit-member-status").value,
  display_name:$("edit-member-name").value.trim()||null,
  organizational_title:$("edit-member-title").value.trim()||null,
  permissions:selectedChoices("edit-member-permissions")};
 try{
  await sensitive("team.update",payload,async()=>{
   notice("team-feedback","Management member updated with audit record.");
   editing=null;visible("team-edit-form",false);await loadTeam();
  });
 }finally{submit.disabled=false}
}
$("management-signin").addEventListener("submit",signIn);
$("invitation-accept-form").addEventListener("submit",acceptInvitation);
$("invitation-existing-toggle").addEventListener("click",toggleExistingAccount);
$("invitation-cancel").addEventListener("click",()=>{inviteToken=null;inviteDetails=null;visible("staff-invitation-panel",false);visible("management-signin",true)});
$("staff-stepup-send").addEventListener("click",sendStepup);
$("staff-stepup-form").addEventListener("submit",verifyStepup);
$("staff-stepup-cancel").addEventListener("click",()=>{pendingSensitive=null;closeStepup()});
$("team-invite-show").addEventListener("click",()=>{buildChoices("invite-permissions");visible("team-invite-form",true);visible("team-edit-form",false)});
$("invite-cancel").addEventListener("click",()=>visible("team-invite-form",false));
$("edit-member-cancel").addEventListener("click",()=>visible("team-edit-form",false));
$("team-invite-form").addEventListener("submit",invite);
$("team-edit-form").addEventListener("submit",saveMember);
window.addEventListener("mednest:module",()=>{if(staff&&authorized)refreshModule()});
window.addEventListener("mednest:signout",signOut);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&authorized)checkSession().catch(signOut)});
inviteToken=parseInviteFromUrl();
if(inviteToken)await loadInvitation();
else try{await checkSession()}catch{await signOut()}
