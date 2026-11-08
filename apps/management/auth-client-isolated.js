"use strict";
// Standalone protected integration preview: staff actions and invitations remain disabled.
// No QR scanning, authenticator app, frontend role claims or student-LMS code.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const URL="https://tdqbjhrmfluiinntmjfh.supabase.co";
const KEY="sb_publishable_Redb-pOjNOSpDKg1uIbUBg_-PUCt5XX";
const API=URL+"/functions/v1/mednest-isolated-auth";
const TEAM=URL+"/functions/v1/mednest-isolated-team";
const SECURITY=URL+"/functions/v1/mednest-isolated-stepup";
const SAFE_ACTIONS=new Set(["me","profile.update","team.list","audit.list"]);
const client=createClient(URL,KEY,{auth:{
  autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,
  storageKey:"sjn-mednest-isolated-staff-v1"
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

const PERMISSION_GROUPS=[
 {name:"Academic Content",description:"Questions, papers, and subject organization",codes:["content.view","content.create","content.edit","content.import","content.review","content.publish","content.archive","taxonomy.manage","pastpapers.manage"]},
 {name:"Courses & Resources",description:"Sessions, schedules, and library resources",codes:["courses.manage","courses.publish","resources.manage"]},
 {name:"Students & Enrollment",description:"Student information, access, and course membership",codes:["students.view","students.details","students.create","students.suspend","enrollments.grant","enrollments.revoke","access.change"]},
 {name:"Reports & Operations",description:"Analytics, support, payments, and notifications",codes:["reports.view","reports.resolve","analytics.view","audit.view","finance.verify","announcements.manage"]}
];
const $=id=>document.getElementById(id);
const visible=(id,on)=>$(id).classList.toggle("is-hidden",!on);
const notice=(id,message,error=false)=>{const element=$(id);element.textContent=message||"";element.dataset.error=String(error)};
const element=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
let staff=null,authorized=false,busy=false,editing=null,inviteToken=null,inviteDetails=null,existingInvite=false;
let pendingSensitive=null,invitationSenderReady=false;
function parseInviteFromUrl(){
 // Integration preview never accepts invitations. Strip stale invite secrets.
 if(window.location.hash.startsWith("#invite=")){
  window.history.replaceState(null,"",window.location.pathname+window.location.search);
  notice("auth-feedback","Invitations are unavailable until secure staff onboarding is approved.",true);
 }
 return null;
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
const manage=(action,fields)=>{
 if(!SAFE_ACTIONS.has(action))return Promise.reject(Error("Staff invitations and permission changes are locked pending security verification."));
 return call(action==="team.list"||action==="audit.list"?TEAM:API,action,fields);
};
const security=(action,fields)=>call(SECURITY,action,fields);
function displayRole(role){return role==="chief_admin"?"Chief Administrator":"Management Team Member"}
function fillProfile(m){
 staff=m;
 const chief=m.role==="chief_admin";
 const display=m.display_name||(chief?"Chief Administrator":"Management Team Member");
 $("member-profile-name").textContent=display;
 $("member-profile-title").textContent=m.organizational_title||"No organizational title assigned";
 $("member-profile-email").textContent=m.email||"—";
 $("member-profile-role").textContent=displayRole(m.role);
 $("member-profile-status").textContent=(m.status||"active").toUpperCase();
 $("member-profile-account-status").textContent=m.status==="active"?"Active":"Inactive";
 $("member-profile-activity").textContent="Verified staff access";
 visible("chief-profile-form",false);
 visible("chief-profile-edit",chief);
 if(chief){
  $("chief-profile-display-name").value=m.display_name||"";
  $("chief-profile-title").value=m.organizational_title||"";
  $("chief-administrator-identity").textContent=m.display_name?
   m.display_name:"Protected Chief Administrator account";
 }
 const avatar=$("profile-preview-open");
 avatar.setAttribute("aria-label","View my profile: "+display);
 avatar.title=display+" · "+displayRole(m.role);
 const rights=$("member-permissions-list");rights.replaceChildren();
 if(chief){
  const panel=element("div","effective-role-summary");
  panel.append(element("strong","","Full Management Access"),element("p","",
   "You have the protected Chief Administrator role. Sensitive staff changes require a fresh email approval."));
  rights.append(panel);
 }else if(!m.permissions?.length){
  rights.append(element("p","secondary-note","No operational permissions assigned"));
 }else{
  for(const group of PERMISSION_GROUPS){
   const granted=group.codes.filter(code=>m.permissions.includes(code));
   if(!granted.length)continue;
   const section=element("section","effective-permission-section");
   section.append(element("h3","",group.name));
   const tags=element("div","effective-permission-tags");
   for(const code of granted)tags.append(element("span","effective-permission-tag",PERMS[code]||code));
   section.append(tags);rights.append(section);
  }
 }
}
function buildChoices(id,selected=[]){
 const box=$(id);box.replaceChildren();
 for(const group of PERMISSION_GROUPS){
  const section=element("fieldset","permission-group");
  const heading=element("legend","permission-group-legend");
  heading.append(element("span","",group.name),element("small","",group.description));
  section.append(heading);
  const controls=element("div","permission-grid");
  for(const code of group.codes){
   const label=element("label","permission-option");
   const check=element("input");
   check.type="checkbox";check.value=code;check.checked=selected.includes(code);
   label.append(check,element("span","",PERMS[code]||code));
   controls.append(label);
  }
  section.append(controls);box.append(section);
 }
}
function selectedChoices(id){return [...$(id).querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value)}
async function signOut(){
 try{await client.auth.signOut({scope:"local"})}catch(_){}
 staff=null;authorized=false;editing=null;pendingSensitive=null;
 $("member-profile-email").textContent="—";
 $("member-profile-name").textContent="Signed out";
 $("chief-administrator-identity").textContent="Protected account";
 $("team-directory-list").replaceChildren();
 $("pending-invitations-list").replaceChildren();
 $("audit-event-list").replaceChildren();
 $("password").value="";$("staff-stepup-code").value="";
 closeStepup();visible("staff-invitation-panel",false);visible("management-signin",true);
 window.dispatchEvent(new Event("mednest:signed-out"));
}
async function checkSession(){
 const {data:{session}}=await client.auth.getSession();
 if(!session?.access_token){if(authorized)await signOut();return;}
 const response=await manage("me");
 if(response?.member?.role!=="chief_admin"||response.member.status!=="active")
   throw Error("No active isolated Chief Administrator access");
 fillProfile(response.member);
 invitationSenderReady=false; // Preview writes remain locked.
 const senderNotice=$("staff-invite-sender-notice");
 senderNotice.textContent="Staff invitations and permissions changes are locked until independent email-security and onboarding tests pass.";
 visible("team-invite-show",false);
 visible("team-invite-form",false);
 visible("team-edit-form",false);
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
// Staff invitation sign-up and acceptance are not supported in this preview.
async function loadInvitation(){
 notice("auth-feedback","Staff registration is disabled until verified onboarding is approved.",true);
 visible("staff-invitation-panel",false);
}
function toggleExistingAccount(){notice("auth-feedback","Invitations are disabled in this preview.",true);}
async function acceptInvitation(event){
 event.preventDefault();
 notice("auth-feedback","Staff invitations are disabled until verified onboarding is approved.",true);
 visible("staff-invitation-panel",false);
}
function renderMembers(members){
 const area=$("team-directory-list");area.replaceChildren();
 // The Chief Administrator is presented in a separate protected identity panel.
 // Team counts and directory refer only to ordinary Management Team Members.
 const team=members.filter(m=>m.role!=="chief_admin");
 const chief=members.find(m=>m.role==="chief_admin");
 visible("chief-administrator-card",Boolean(chief));
 if(chief){
  $("chief-administrator-identity").textContent=chief.display_name
   ?chief.display_name:"Protected Chief Administrator account";
 }
 $("team-total").textContent=members.length;
 $("team-active").textContent=members.filter(x=>x.status==="active").length;
 if(!team.length){
  area.append(element("p","staff-empty-state","No Management Team Members yet. This area will display authorized members after staff onboarding is safely enabled."));
  return;
 }
 for(const member of team){
  const row=element("div","staff-row"),left=element("div");
  left.append(element("strong","",member.display_name||member.email),
    element("p","",member.email+" · "+displayRole(member.role)+" · "+member.status));
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
 visible("team-invite-show",false);
 $("team-invite-show").disabled=true;
 if(staff?.role!=="chief_admin"){
  $("team-directory-list").replaceChildren(element("p","secondary-note","Only Chief Admin can manage staff access."));
  $("pending-invitations-list").replaceChildren(element("p","secondary-note","Only Chief Admin can view pending invitations."));
  return;
 }
 try{
  const response=await manage("team.list");
  renderMembers([...(response.chief||[]),...(response.members||[])]);
  renderInvitations(response.invitations||[]);
  visible("team-invite-show",false);
  visible("team-invite-form",false);
  visible("team-edit-form",false);
 }catch(e){notice("team-feedback",e.message,true)}
}
const auditType=action=>{
 const name=String(action||"");
 if(name.startsWith("content.")||name.includes("mcq")||name.startsWith("academic."))return "content";
 if(name.startsWith("staff.")||name.startsWith("team.")||name.startsWith("profile.")||name.includes("invitation"))return "staff";
 return "other";
};
const auditDescription=action=>({
 "content.batch_created":"Draft created",
 "content.draft_chunk_saved":"Questions saved to draft",
 "content.batch_state_changed":"Draft status changed",
 "content.mcq_edit_draft_saved":"Existing MCQ correction saved"
})[action]||String(action||"Management activity").replaceAll("."," · ").replaceAll("_"," ");
async function loadAudit(){
 const box=$("audit-event-list"),summary=$("audit-summary");
 box.replaceChildren(element("p","secondary-note","Loading verified activity…"));
 try{
  const result=await manage("audit.list",{period:$("audit-period").value});
  const type=$("audit-action-filter").value;
  const events=(result.events||[]).filter(e=>type==="all"||auditType(e.action)===type);
  box.replaceChildren();
  summary.textContent=events.length+" matching recorded events, most recent first"+
   (result.limit?" (up to "+result.limit+" retrieved).":".")+
   " Counts represent audit events, not unique MCQs uploaded or published.";
  if(!events.length){box.append(element("p","secondary-note","No recorded activity matches these filters."));return}
  for(const event of events){
   const row=element("div","staff-row"),info=element("div");
   info.append(element("strong","",auditDescription(event.action)));
   info.append(element("p","",(event.actor?event.actor+" · ":"")+new Date(event.created_at).toLocaleString()));
   const d=event.details||{},parts=[];
   if(d.name)parts.push("Draft: "+d.name);
   if(d.mcq_id)parts.push("MCQ #"+d.mcq_id);
   if(d.count)parts.push(d.count+" rows saved in this operation");
   if(d.from&&d.to)parts.push(d.from.replaceAll("_"," ")+" → "+d.to.replaceAll("_"," "));
   if(d.route)parts.push("Route: "+d.route);
   if(parts.length)info.append(element("p","",parts.join(" · ")));
   row.append(info);box.append(row);
  }
 }catch(e){box.replaceChildren(element("p","auth-feedback",e.message));summary.textContent="Activity unavailable: "+e.message}
}
$("audit-refresh").addEventListener("click",loadAudit);
$("audit-period").addEventListener("change",loadAudit);
$("audit-action-filter").addEventListener("change",loadAudit);
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
  else notice("team-feedback","Email security confirmed. Sensitive staff-access changes are authorized for 30 minutes in this session.");
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
async function saveChiefProfile(event){
 event.preventDefault();
 if(staff?.role!=="chief_admin"){
  notice("chief-profile-feedback","Only Chief Administrator may update this profile",true);
  return;
 }
 const save=$("chief-profile-save");save.disabled=true;
 try{
  const result=await manage("profile.update",{
   display_name:$("chief-profile-display-name").value.trim()||null,
   organizational_title:$("chief-profile-title").value.trim()||null
  });
  if(!result.success||!result.member)throw Error("Profile could not be updated");
  fillProfile(result.member);
  notice("chief-profile-feedback","Profile updated successfully.");
  visible("chief-profile-form",false);
 }catch(e){
  notice("chief-profile-feedback",e.message,true);
 }finally{save.disabled=false}
}
$("management-signin").addEventListener("submit",signIn);
$("chief-profile-form").addEventListener("submit",saveChiefProfile);
$("chief-profile-edit").addEventListener("click",()=>{
  if(staff?.role!=="chief_admin")return;
  visible("chief-profile-form",true);
  visible("chief-profile-edit",false);
  notice("chief-profile-feedback","");
  $("chief-profile-display-name").focus();
});
$("chief-profile-open").addEventListener("click",()=>{
  const profileNav=document.querySelector('[data-module="profile"]');
  profileNav?.click();
});
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
try{await checkSession()}catch{await signOut()}
