"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=()=>read("apps/management/index.html");
const ui=()=>read("apps/management/app.js");
const auth=()=>read("apps/management/auth-client.js");
const edge=()=>read("database/management/mednest-edge-function/index.ts");
const policy=()=>JSON.parse(read("apps/management/vercel.json")).headers[0].headers.find(x=>x.key==="Content-Security-Policy").value;

test("Management app keeps corrected MedNest identity, distinct theme and common logo",()=>{
 const h=html(),s=read("apps/management/styles.css");
 assert.match(h,/SJN MedNest/);
 assert.doesNotMatch(h,/SJN Madnest|SJN Madness/);
 assert.match(h,/Academy Management<br><em>Workspace\.<\/em>/);
 assert.equal((h.match(/class="brand-symbol(?: brand-symbol--small)?"/g)||[]).length,2);
 assert.match(h,/<span class="brand-symbol" aria-hidden="true">SJN<\/span>/);
 assert.match(h,/data-theme-choice="system"/);
 assert.match(h,/data-theme-choice="dark"/);
 assert.match(h,/data-theme-choice="light"/);
 assert.match(s,/html\[data-theme="light"\] \.auth-panel/);
 assert.match(s,/html\[data-theme="light"\] \.sidebar/);
});
test("Staff Sign In is a real form; no student LMS UI or API import",()=>{
 const h=html(),a=auth(),shell=ui();
 assert.match(h,/id="management-signin"/);
 assert.match(h,/id="mfa-panel"/);
 assert.match(h,/id="mfa-form"/);
 assert.match(h,/src="\/auth-client\.js"/);
 assert.match(a,/signInWithPassword/);
 assert.match(a,/auth\.mfa\.challengeAndVerify/);
 assert.match(a,/auth\.mfa\.enroll/);
 assert.match(a,/auth\.mfa\.listFactors/);
 assert.match(a,/mednest-management/);
 assert.match(a,/staff-session-v1/);
 assert.match(shell,/mednest:authorized/);
 assert.match(shell,/mednest:signout/);
 assert.doesNotMatch(a,/from ['"]\.\.\/\.\.\/public\//);
 assert.doesNotMatch(a,/service_role|SERVICE_ROLE_KEY|SUPABASE_SECRET/);
 assert.doesNotMatch(a,/innerHTML\s*=/);
});
test("Member profile displays verified role and fine-grained effective permission data",()=>{
 const h=html(),a=auth();
 for(const id of ["member-profile-name","member-profile-title","member-profile-email","member-profile-role","member-profile-status","member-permissions-list","team-directory-list","team-invite-form","team-edit-form","audit-event-list"])assert.ok(h.includes('id="'+id+'"'),id);
 assert.match(a,/function fillProfile/);
 assert.match(a,/member\.permissions/);
 assert.match(a,/role==="chief_admin"/);
 assert.match(a,/request\("team\.invite"/);
 assert.match(a,/request\("team\.update"/);
 assert.match(a,/request\("audit\.list"/);
 assert.match(h,/Chief Admin/);
 assert.match(h,/Member Profile/);
});
test("Edge service checks verified JWT, staff membership, email, MFA, and Chief Admin role",()=>{
 const s=edge();
 assert.match(s,/srv\.auth\.getUser\(jwt\)/);
 assert.match(s,/verified\.user\.email_confirmed_at/);
 assert.match(s,/mednest_management_members/);
 assert.match(s,/member\.email!==identity\.email\?\.toLowerCase\(\)/);
 assert.match(s,/aal!=="aal2"/);
 assert.match(s,/member\.technical_role!=="chief_admin"/);
 assert.match(s,/team\.invite/);
 assert.match(s,/team\.update/);
 assert.match(s,/audit\.list/);
 assert.match(s,/new Response\(null,\{status:204/);
 assert.doesNotMatch(s,/raw_user_meta_data|user_metadata\s*[.\[]/);
 assert.doesNotMatch(s,/x-admin-token|ADMIN_TOKEN/);
});
test("Auth separation, restricted origin, and server-only privileged keys",()=>{
 const c=policy(),h=html(),a=auth(),s=edge();
 assert.match(c,/script-src 'self' https:\/\/esm\.sh/);
 assert.match(c,/https:\/\/aozknkrwafowsrehdwlr\.supabase\.co/);
 assert.match(c,/form-action 'none'/);
 assert.match(c,/frame-ancestors 'none'/);
 assert.match(s,/ADMIN_ORIGINS\.test\(origin\)/);
 assert.match(s,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(a,/sb_publishable_/);
 assert.match(h,/Authorized management staff only/);
 assert.match(h,/id="team-total"/);
 assert.match(h,/id="team-active"/);
 assert.match(h,/id="team-invited"/);
 assert.match(h,/Registered Students<\/span><strong>—<\/strong>/);
 assert.match(h,/Published MCQs<\/span><strong>—<\/strong>/);
});

test("Dedicated Chief Admin identity setup neither requires student UI nor grants staff privileges",()=>{
 const page=html(),browser=auth(),server=edge();
 for(const id of ["chief-setup-panel","chief-setup-form","chief-setup-submit","chief-setup-feedback"])assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(page,/No student LMS registration is required/);
 assert.match(browser,/client\.auth\.signUp\(/);
 assert.match(browser,/emailRedirectTo:window\.location\.origin\+"\/"/);
 assert.match(browser,/registerInitialChief/);
 assert.doesNotMatch(browser,/from\(["']mednest_management_members["']\)/);
 assert.match(server,/srv\.auth\.getUser\(jwt\)/);
 assert.match(server,/mednest_management_members/);
 assert.match(server,/member\.technical_role!=="chief_admin"/);
});

test("Staff verification requires authenticated account and separate provider",()=>{
 const page=html(),browser=auth();
 for(const id of ["staff-verify-panel","staff-verify-send","staff-verify-form","staff-verify-code","staff-verify-status"])
  assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(browser,/VERIFY_API=URL\+"\/functions\/v1\/mednest-staff-onboarding"/);
 assert.match(browser,/await onboardingRequest\("status"\)/);
 assert.match(browser,/await onboardingRequest\("send"\)/);
 assert.match(browser,/await onboardingRequest\("verify",\{code\}\)/);
 assert.match(browser,/err\.status=resp\.status/);
 assert.match(browser,/if\(e\.status===403\)/);
 assert.match(page,/no administrative privileges|No student email verification settings have been changed/i);
});

test("Staff-only OTP is mandatory for invited members and Chief Admin bootstrap",()=>{
 const edge=read("database/management/mednest-edge-function/index.ts");
 const verify=read("database/management/mednest-staff-onboarding/index.ts");
 assert.match(edge,/Staff-only email verification required/);
 assert.doesNotMatch(edge,/staff\.activate/);
 assert.match(edge,/Staff invitations are unavailable until the dedicated email provider is configured/);
 assert.doesNotMatch(edge,/inviteUserByEmail/);
 assert.match(verify,/mednest_management_bootstrap_approvals/);
 assert.doesNotMatch(verify,/jumanniz8@gmail\.com/);
 assert.match(verify,/MEDNEST_STAFF_EMAIL_PEPPER/);
 assert.match(verify,/RESEND_API_KEY/);
 assert.match(verify,/expires_at:new Date\(now\+10\*60\*1000\)/);
 assert.match(verify,/attempt_count:0/);
 assert.match(verify,/await db\.rpc\("mednest_complete_staff_email_verification"/);
});

test("Chief Admin email proof transitions to MFA without exposing privileged routes",()=>{
 const edge=read("database/management/mednest-edge-function/index.ts");
 const probe=edge.indexOf('if(action==="me")');
 const enforce=edge.indexOf('if(aal!=="aal2")');
 const list=edge.indexOf('if(action==="team.list")');
 assert.ok(probe>0 && enforce>probe && list>enforce,"profile handshake before MFA enforcement; privileged ops afterward");
 assert.match(edge,/if\(member.status!=="active"\)return reply\(origin,403,\{error:"Staff-only email verification required"\}\)/);
 assert.match(edge,/mfa_required:aal!=="aal2"/);
 assert.match(edge,/if\(member.technical_role!=="chief_admin"\)/);
 assert.equal((edge.match(/if\(action==="me"\)/g)||[]).length,1);
 const browser=auth();
 assert.match(browser,/await checkSession\(\);/);
 assert.match(browser,/if\(data.mfa_required\)\{staff=data.member;await startMfa\(\);return\}/);
});
