"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sql=()=>read("database/management/isolated-staff-auth-foundation.sql");
const api=()=>read("database/management/mednest-isolated-auth/index.ts");
const client=()=>read("apps/management/isolated-auth-preview.js");
const html=()=>read("apps/management/isolated-auth-preview.html");
test("Dedicated management Supabase project is not the student staging project",()=>{
 const s=sql(),a=api(),c=client(),old=read("apps/management/auth-client.js");
 assert.match(s,/tdqbjhrmfluiinntmjfh/);
 assert.match(a,/tdqbjhrmfluiinntmjfh/);
 assert.match(c,/tdqbjhrmfluiinntmjfh/);
 assert.match(old,/aozknkrwafowsrehdwlr/);
 assert.doesNotMatch(old,/tdqbjhrmfluiinntmjfh/);
 assert.doesNotMatch(c,/aozknkrwafowsrehdwlr/);
 assert.match(client(),/storageKey:"sjn-mednest-isolated-staff-v1"/);
});
test("New management Auth never registers student accounts or changes student exam path",()=>{
 const s=sql(),a=api(),c=client();
 assert.doesNotMatch(s,/create trigger|handle_new_user|public\.profiles|student_attempt|practice_submissions/i);
 assert.doesNotMatch(a,/public\.profiles|student_attempt|practice_submissions|team\.invite|team\.list|audit\.list|student\.list/);
 assert.doesNotMatch(c,/team\\.invite|team\\.list|service_role/i);
 assert.match(a,/\["me","profile\.update"\]/);
});
test("Management SQL denies browser access and permits only one verified Chief account",()=>{
 const s=sql();
 for(const name of ["mednest_staff_members","mednest_staff_bootstrap","mednest_staff_audit"]){
  assert.match(s,new RegExp("alter table public\\."+name+" enable row level security"));
 }
 assert.match(s,/revoke all on table .* from public,anon,authenticated/);
 assert.match(s,/create unique index mednest_staff_one_chief/);
 assert.match(s,/email_confirmed_at/);
 assert.match(s,/mednest_staff_bootstrap/);
 assert.match(s,/extensions\.digest/);
 assert.match(s,/security definer set search_path=pg_catalog/);
 for(const fn of ["mednest_staff_claim_chief","mednest_staff_update_chief_profile","mednest_staff_session_live"])
  assert.ok(s.includes("revoke all on function public."+fn),fn);
});
test("Only Chief's own profile and permissions can be accessed, with server-verified auth",()=>{
 const s=sql(),a=api(),h=html();
 assert.match(a,/db\.auth\.getUser\(token\)/);
 assert.match(a,/j\.iss!==URL\+"\/auth\/v1"/);
 assert.match(a,/j\.aud!=="authenticated"/);
 assert.match(a,/mednest_staff_session_live/);
 assert.match(a,/member\.technical_role!=="chief_admin"/);
 assert.ok(a.includes('member.email!==(user.email||"").toLowerCase()'));
 assert.match(s,/where user_id=p_user_id and technical_role='chief_admin' for update/);
 assert.match(s,/chief\.profile_updated/);
 assert.match(h,/only shown to you/i);
 assert.doesNotMatch(a,/audit\.list|team\.list/);
});
test("Isolated preview route and management origin are protected",()=>{
 const c=client(),h=html(),a=api();
 const config=JSON.parse(read("apps/management/vercel.json"));
 const csp=config.headers[0].headers.find(x=>x.key==="Content-Security-Policy").value;
 assert.match(csp,/https:\/\/tdqbjhrmfluiinntmjfh\.supabase\.co/);
 assert.match(csp,/https:\/\/aozknkrwafowsrehdwlr\.supabase\.co/);
 assert.match(c,/auth\.signInWithPassword/);
 assert.match(c,/auth\.signUp/);
 assert.match(c,/auth\.signOut/);
 assert.match(c,/detectSessionInUrl:true/);
 assert.match(c,/emailRedirectTo:EMAIL_CONFIRM_REDIRECT/);
 assert.match(c,/sjn-mednest-management-git-sjn-phase1a-foundation-sjn1\\.vercel\\.app/);
 assert.match(h,/isolated-auth-preview\.js/);
 assert.match(a,/sjn-mednest-management/);
 assert.match(a,/const ORIGIN=/);
 assert.match(a,/git-sjn-phase1a-foundation/);
 assert.doesNotMatch(a,/access-control-allow-origin": "\*"/);
 assert.doesNotMatch(c,/service_role|sb_secret_|innerHTML\s*=/);
});
