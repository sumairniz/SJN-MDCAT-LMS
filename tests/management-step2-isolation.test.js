"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const html=()=>read("apps/management/index.html");
const client=()=>read("apps/management/auth-client.js");
const management=()=>read("database/management/mednest-edge-function/index.ts");
const stepup=()=>read("database/management/mednest-management-stepup/index.ts");
const onboarding=()=>read("database/management/mednest-staff-onboarding/index.ts");
const csp=()=>JSON.parse(read("apps/management/vercel.json")).headers[0].headers.find(x=>x.key==="Content-Security-Policy").value;

test("SJN MedNest remains isolated, branded and supports complete light/dark themes",()=>{
 const h=html(),css=read("apps/management/styles.css");
 assert.match(h,/SJN MedNest/);
 assert.doesNotMatch(h,/SJN Madnest|SJN Madness/);
 assert.match(h,/Academy Management<br><em>Workspace\.<\/em>/);
 assert.equal((h.match(/class="brand-symbol(?: brand-symbol--small)?"/g)||[]).length,2);
 for(const theme of ["system","light","dark"])assert.ok(h.includes('data-theme-choice="'+theme+'"'));
 for(const selector of ['.auth-panel','.sidebar','.staff-stepup-modal'])
  assert.ok(css.includes('html[data-theme="light"] '+selector),selector);
 assert.match(css,/staff-stepup-backdrop/);
 assert.match(css,/staff-invite-notice/);
});
test("Approved password-only management login removes mandatory MFA and public Chief Admin signup",()=>{
 const h=html(),a=client(),u=read("apps/management/app.js");
 assert.match(h,/id="management-signin"/);
 assert.match(a,/auth\.signInWithPassword/);
 assert.match(a,/staff-session-v1/);
 assert.match(u,/mednest:authorized/);
 assert.match(u,/mednest:signout/);
 assert.doesNotMatch(h,/id="mfa-panel"|id="mfa-qr"|id="chief-setup-panel"/);
 assert.doesNotMatch(h,/First-time Chief Admin account setup|Scan this authentication QR code/);
 assert.doesNotMatch(a,/auth\.mfa\.|startMfa|mfa\.enroll/);
 assert.doesNotMatch(management(),/aal2|mfa_required/);
 assert.doesNotMatch(a,/service_role|SERVICE_ROLE_KEY|SUPABASE_SECRET|innerHTML\s*=/);
});
test("Only individual email invitations create Management Team Members",()=>{
 const h=html(),a=client(),s=management();
 for(const id of ["staff-invitation-panel","invitation-accept-form","invitation-email",
  "invitation-password","invitation-password-confirm","invitation-existing-toggle",
  "pending-invitations-list","team-invite-form","team-edit-form","staff-invite-sender-notice"])
  assert.ok(h.includes('id="'+id+'"'),id);
 assert.match(a,/parseInviteFromUrl/);
 assert.match(a,/^/);
 assert.match(a,/window\.history\.replaceState/);
 assert.match(a,/manage\("invite\.accept",\{token:inviteToken\}\)/);
 assert.match(a,/auth\.signUp\(\{email,password/);
 assert.match(a,/auth\.signInWithPassword\(\{email,password\}\)/);
 assert.match(s,/invite\.preview/);
 assert.match(s,/invite\.accept/);
 assert.match(s,/mednest_accept_management_invitation/);
 assert.match(s,/sha256\(body\.token\.toLowerCase\(\)\)/);
 assert.match(s,/mednest_create_management_invitation/);
 assert.match(s,/mednest_revoke_management_invitation/);
 assert.match(s,/invitation_sender_configured/);
 assert.match(a,/team-invite-show"\)\.disabled=!invitationSenderReady/);
});
test("Chief Admin can invite, update and revoke only with verified session-bound email approval",()=>{
 const s=management(),p=stepup();
 assert.match(s,/db\.auth\.getUser\(jwt\)/);
 assert.match(s,/j\.sub!==user\.id/);
 assert.match(s,/member\.technical_role!=="chief_admin"/);
 assert.match(s,/member\.status!=="active"/);
 assert.match(s,/checkStepup\(user\.id,j\.session_id\)/);
 assert.match(s,/stepup_required:true/);
 assert.match(s,/mednest_update_member_with_email_stepup/);
 assert.match(s,/mednest_create_management_invitation/);
 assert.match(s,/mednest_revoke_management_invitation/);
 assert.match(p,/auth\.getUser\(jwt\)/);
 assert.match(p,/claims\.session_id/);
 assert.match(p,/mednest_reserve_management_stepup/);
 assert.match(p,/mednest_verify_management_stepup/);
 assert.match(p,/mednest_management_members/);
 assert.match(p,/technical_role!=="chief_admin"/);
 assert.match(p,/verified_until/);
 assert.doesNotMatch(p,/user_metadata|raw_user_meta_data|service_role.*["'][a-zA-Z0-9]{30}/);
});
test("Email approval codes are session-scoped, hashed, temporary, throttled and never sent to client",()=>{
 const s=stepup();
 assert.match(s,/HMAC/);
 assert.match(s,/sjn-mednest-staff-stepup-v1/);
 assert.match(s,/session\+":"\+code/);
 assert.match(s,/code8\(\)/);
 assert.match(s,/RESEND_API_KEY/);
 assert.match(s,/api\.resend\.com\/emails/);
 assert.match(s,/if\(!sent\.ok\)/);
 assert.match(s,/8-digit|eight-digit/);
 assert.doesNotMatch(s,/code:code|otp:code|secret:code/);
 assert.match(client(),/security\("verify",\{code\}\)/);
 const h=html();
 assert.match(h,/id="staff-stepup-backdrop"/);
 assert.match(h,/id="staff-stepup-send"/);
 assert.match(h,/id="staff-stepup-code"/);
 assert.match(h,/id="staff-stepup-form"/);
});
test("Invitations and permissions reject unauthorized student or ordinary team member",()=>{
 const s=management();
 assert.match(s,/Management account not authorized/);
 assert.match(s,/Only Chief Admin may change staff access/);
 assert.match(s,/Chief Admin cannot edit own role/);
 assert.match(s,/validatePermissions/);
 assert.match(s,/if\(!RESEND\|\|!SENDER/);
 assert.match(s,/invitation_sender_configured/);
 assert.match(s,/session_id/);
 assert.match(s,/token64\(\)/);
 assert.match(s,/sha256\(token\)/);
 assert.match(s,/Date\(data\.expires_at\)/);
 assert.doesNotMatch(s,/user_metadata|raw_user_meta_data/);
});
test("Management CSP, service-only secrets and student source isolation",()=>{
 const p=csp(),h=html(),a=client(),s=management();
 assert.match(p,/default-src 'none'/);
 assert.match(p,/script-src 'self' https:\/\/esm\.sh/);
 assert.match(p,/connect-src 'self' https:\/\/aozknkrwafowsrehdwlr\.supabase\.co/);
 assert.match(p,/form-action 'none'/);
 assert.match(p,/frame-ancestors 'none'/);
 assert.match(s,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(a,/sb_publishable_/);
 assert.match(s,/ORIGINS\.test\(origin\)/);
 assert.match(stepup(),/ORIGINS\.test\(origin\)/);
 assert.match(h,/No student LMS registration is required/);
 assert.match(h,/id="team-total"/);
 assert.match(h,/id="team-active"/);
 assert.match(h,/id="team-invited"/);
 assert.match(h,/Registered Students<\/span><strong>—<\/strong>/);
 assert.match(h,/Published MCQs<\/span><strong>—<\/strong>/);
});
test("Previously implemented one-time email proof remains separate from ordinary login",()=>{
 const s=onboarding();
 assert.match(s,/mednest_management_bootstrap_approvals/);
 assert.match(s,/MEDNEST_STAFF_EMAIL_PEPPER/);
 assert.match(s,/mednest_complete_staff_email_verification/);
 assert.doesNotMatch(s,/jumanniz8@gmail\.com/);
 assert.doesNotMatch(client(),/mednest-staff-onboarding/);
});
test("Every JavaScript DOM lookup has a matching management UI element",()=>{
 const js=client(),h=html();
 const ids=[...js.matchAll(/\$\("([a-z0-9-]+)"\)/gi)].map(m=>m[1]);
 for(const id of new Set(ids)) assert.ok(h.includes('id="'+id+'"'),"Missing #"+id);
});

test("New staff creation remains fail-closed while Auth signup inserts student profiles",()=>{
 const server=management(),h=html(),browser=client();
 assert.match(server,/const STAFF_IDENTITY_ISOLATED=false/);
 for(const a of ["invite.preview","invite.accept","team.invite"]){
  const index=server.indexOf('if(action==="'+a+'")');
  assert.ok(index>=0,a+" must have a route");
  assert.match(server.slice(index,index+390),/if\(!STAFF_IDENTITY_ISOLATED\)return response\(origin,503/);
 }
 assert.match(server,/invitation_sender_configured:Boolean\(STAFF_IDENTITY_ISOLATED&&RESEND/);
 assert.match(browser,/team-invite-show"\)\.disabled=!invitationSenderReady/);
 assert.match(browser,/student-profile creation|Student LMS.s automatic student-profile creation/i);
 assert.match(h,/id="staff-invite-sender-notice"/);
 assert.doesNotMatch(h,/id="team-test-security"/);
 assert.doesNotMatch(browser,/team-test-security/);
 assert.match(browser,/staff-stepup-send/);
});

test("Chief Administrator is separate from ordinary Team Members",()=>{
 const h=html(),a=client(),api=management(),app=read("apps/management/app.js");
 for(const id of ["chief-administrator-card","chief-administrator-identity","chief-profile-open",
  "team-directory-list","team-total","team-active","team-invited"])
   assert.ok(h.includes('id="'+id+'"'),id);
 assert.match(a,/members\.filter\(m=>m\.role!=="chief_admin"\)/);
 assert.match(a,/members\.find\(m=>m\.role==="chief_admin"\)/);
 assert.match(a,/displayRole\(role\)/);
 assert.match(a,/role==="chief_admin"\?"Chief Administrator"/);
 assert.match(app,/profile: \["My Profile"/);
 assert.match(h,/id="member-profile-name"/);
 assert.match(h,/id="member-profile-role"/);
 assert.match(h,/id="chief-profile-form"/);
 assert.match(h,/id="chief-profile-display-name"/);
 assert.match(h,/id="chief-profile-title"/);
 assert.match(api,/profile\.update/);
 assert.match(api,/mednest_update_chief_own_profile/);
 assert.match(api,/member\.technical_role!=="chief_admin"/);
});
test("Permission selection uses compact grouped checkboxes instead of oversized full-width inputs",()=>{
 const a=client(),css=read("apps/management/styles.css");
 const groups=["Academic Content","Courses & Resources","Students & Enrollment","Reports & Operations"];
 for(const group of groups)assert.ok(a.includes('name:"'+group+'"'),group);
 assert.match(a,/function buildChoices\(id,selected=\[\]\)/);
 assert.match(a,/fieldset","permission-group"/);
 assert.match(a,/input"\);/);
 assert.match(css,/\.permission-option input\[type="checkbox"\]/);
 assert.match(css,/width:16px!important;height:16px!important/);
 assert.match(css,/html\[data-theme="light"\] \.staff-form \.permission-option/);
 assert.match(css,/@media\(max-width:760px\)/);
});
test("Temporary email security test button removed without disabling email step-up protection",()=>{
 const h=html(),a=client(),edge=management();
 assert.doesNotMatch(h,/Test Email Security Verification|id="team-test-security"/);
 assert.doesNotMatch(a,/team-test-security/);
 assert.match(a,/security\("status"\)/);
 assert.match(a,/security\("verify",\{code\}\)/);
 assert.match(edge,/checkStepup\(user\.id,j\.session_id\)/);
 assert.match(h,/id="staff-stepup-backdrop"/);
});
