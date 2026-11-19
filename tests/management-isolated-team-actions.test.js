"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const get=p=>fs.readFileSync(path.join(root,p),"utf8");
test("New isolated team action API remains explicitly fail-closed",()=>{
 const s=get("database/management/mednest-isolated-team-actions/index.ts");
 assert.match(s,/const WRITES_ENABLED=false/);
 assert.ok(s.includes('if(!["capabilities","invite.preview"].includes(body.action)&&!WRITES_ENABLED)'));
 assert.match(s,/if\(!WRITES_ENABLED\)return response/);
 assert.match(s,/mednest_staff_session_live/);
 assert.match(s,/db\.auth\.getUser\(token\)/);
 assert.match(s,/const REF="tdqbjhrmfluiinntmjfh"/);
 assert.doesNotMatch(s,/aozknkrwafowsrehdwlr|student_attempt|public\.profiles/);
 assert.match(s,/senderConfigured\(\)/);
 assert.match(s,/mednest_staff_create_invitation/);
 assert.match(s,/mednest_staff_change_member/);
 assert.match(s,/mednest_staff_accept_invitation/);
});
test("The staged endpoint exposes only capability status until gates pass",()=>{
 const s=get("database/management/mednest-isolated-team-actions/index.ts");
 assert.match(s,/staff_writes_enabled:WRITES_ENABLED/);
 assert.match(s,/staff_invitation_delivery_enabled:WRITES_ENABLED&&senderConfigured\(\)/);
 assert.match(s,/const WRITES_ENABLED=false/);
 assert.match(s,/!WRITES_ENABLED/);
});
test("Staff account setup and sensitive authorizations are distinct",()=>{
 const s=get("database/management/isolated-staff-team-invitations.sql");
 assert.match(s,/mednest_staff_sensitive_authorized\(p_actor,p_session,'staff\.invite'\)/);
 assert.match(s,/mednest_staff_sensitive_authorized\(p_actor,p_session,v_action\)/);
 assert.match(s,/mednest_staff_sensitive_authorized\(p_actor,p_session,'staff\.invite\.revoke'\)/);
 assert.match(s,/p_hash !~/);
});
