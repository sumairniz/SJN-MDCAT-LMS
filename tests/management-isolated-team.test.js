"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const api=()=>read("database/management/mednest-isolated-team/index.ts");
const sql=()=>read("database/management/isolated-staff-team-invitations.sql");
test("Isolated staff-management foundation cannot touch student staging Auth",()=>{
 const s=sql(),a=api();
 assert.doesNotMatch(s,/aozknkrwafowsrehdwlr|student_attempt|student_profile|public\.profiles/i);
 assert.doesNotMatch(a,/aozknkrwafowsrehdwlr|student_attempt|student_profile|service_role.*frontend/i);
 assert.match(a,/tdqbjhrmfluiinntmjfh/);
 assert.match(s,/auth\.users/);
});
test("No staff mutations are callable in live Team API before sender and step-up release gates",()=>{
 const a=api();
 assert.match(a,/!\["team\.list","audit\.list"\]\.includes/);
 assert.match(a,/mutations_enabled:false/);
 assert.match(a,/invitation_delivery_enabled:false/);
 assert.doesNotMatch(a,/team\.invite.*execute|team\.update.*execute|rpc\("mednest_staff_create_invitation"/);
 assert.match(a,/db\.auth\.getUser\(token\)/);
 assert.match(a,/mednest_staff_session_live/);
 assert.match(a,/chief\)return reply\(origin,403/);
});
test("Audit log deliberately never contains email, identifiers or event details",()=>{
 const a=api();
 assert.match(a,/select\("id,action,created_at"\)/);
 assert.match(a,/action:e\.action,created_at:e\.created_at/);
 assert.doesNotMatch(a,/select\("actor_user_id|select\("details|details:e\.details/);
});
test("Staff mutations require live same-session sensitive authorization inside SQL transaction",()=>{
 const s=sql();
 for(const code of ["staff.invite","staff.invite.revoke"])assert.ok(s.includes(code));
 assert.match(s,/mednest_staff_sensitive_authorized\(p_actor,p_session,'staff\.invite'\)/);
 assert.match(s,/mednest_staff_sensitive_authorized\(p_actor,p_session,v_action\)/);
 assert.match(s,/mednest_staff_sensitive_authorized\(p_actor,p_session,'staff\.invite\.revoke'\)/);
 assert.match(s,/where token_hash=p_hash for update/);
 assert.match(s,/email_confirmed_at/);
 assert.match(s,/interval '72 hours'/);
 assert.match(s,/state in \('pending','accepted','revoked','expired'\)/);
 assert.match(s,/unique index mednest_staff_one_pending_invitation_email/);
 assert.match(s,/alter table public\.mednest_staff_invitations enable row level security/);
 assert.match(s,/revoke all on public\.mednest_staff_invitations from public,anon,authenticated/);
 for(const rpc of ["mednest_staff_create_invitation","mednest_staff_revoke_invitation","mednest_staff_accept_invitation","mednest_staff_change_member"])
  assert.ok(s.includes("revoke all on function public."+rpc),rpc);
});
test("Isolated Team preview is read-only and uses protected Team API",()=>{
 const h=read("apps/management/isolated-auth-preview.html"),c=read("apps/management/isolated-auth-preview.js");
 assert.match(h,/id="team-members"/);
 assert.match(h,/id="team-status"/);
 assert.match(c,/mednest-isolated-team/);
 assert.match(c,/api\("team\.list",\{\},TEAM\)/);
 assert.doesNotMatch(c,/api\("team\.invite"/);
 assert.doesNotMatch(c,/api\("team\.update"/);
 assert.doesNotMatch(c,/innerHTML\s*=/);
 assert.match(c,/\.textContent=/);
});
