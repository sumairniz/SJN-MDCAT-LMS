"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("New professional preview uses the original shell without replacing rollback login",()=>{
 const base=read("apps/management/index.html");
 const preview=read("apps/management/integrated-auth-preview.html");
 const old=read("apps/management/auth-client.js");
 const integrated=read("apps/management/auth-client-isolated.js");
 assert.ok(base.includes('src="/auth-client.js"'));
 assert.ok(preview.includes('src="/auth-client-isolated.js"'));
 assert.ok(preview.includes('src="/app.js"'));
 for(const id of ['id="workspace"','id="team-preview"','id="chief-profile-form"','id="profile-preview"','id="audit-preview"','id="management-signin"'])
  assert.ok(preview.includes(id),id);
 assert.ok(old.includes('https://aozknkrwafowsrehdwlr.supabase.co'));
 assert.ok(integrated.includes('https://tdqbjhrmfluiinntmjfh.supabase.co'));
 assert.ok(!integrated.includes('https://aozknkrwafowsrehdwlr.supabase.co'));
 assert.ok(integrated.includes('storageKey:"sjn-mednest-isolated-staff-v1"'));
});
test("Session authorization always passes isolated Chief server role verification",()=>{
 const s=read("apps/management/auth-client-isolated.js");
 assert.ok(s.includes('response?.member?.role!=="chief_admin"'));
 assert.ok(s.includes('response.member.status!=="active"'));
 assert.ok(s.includes('SAFE_ACTIONS.has(action)'));
 assert.ok(s.includes('mednest-isolated-auth'));
 assert.ok(s.includes('mednest-isolated-team'));
 assert.ok(s.includes('mednest-isolated-stepup'));
 assert.ok(s.includes('["me","profile.update","team.list","audit.list"]'));
 assert.ok(s.includes('return call(action==="team.list"||action==="audit.list"?TEAM:API'));
});
test("Invitations, permission changes, student access and sensitive writes stay locked",()=>{
 const s=read("apps/management/auth-client-isolated.js");
 const html=read("apps/management/integrated-auth-preview.html");
 assert.ok(s.includes('invitationSenderReady=false'));
 assert.ok(s.includes('visible("team-invite-show",false)'));
 assert.ok(s.includes('visible("team-invite-form",false)'));
 assert.ok(s.includes('visible("team-edit-form",false)'));
 assert.ok(s.includes('Invitations are unavailable until secure staff onboarding is approved.'));
 assert.ok(!s.includes('disabledLegacyInviteParser'));
 assert.ok(!s.includes('client.auth.signUp('));
 assert.ok(html.includes('id="team-invite-show" class="secondary-btn is-hidden" disabled'));
 assert.ok(!s.includes('const URL="https://aozknkrwafowsrehdwlr.supabase.co"'));
 assert.ok(!s.includes('"student_access_update"'));
});
test("Chief email stays out of the team identity card and audit response",()=>{
 const s=read("apps/management/auth-client-isolated.js");
 assert.ok(s.includes('m.display_name:"Protected Chief Administrator account"'));
 assert.ok(s.includes('chief.display_name:"Protected Chief Administrator account"'));
 assert.ok(!s.includes('Actor ID: "+event.actor_user_id'));
 assert.ok(s.includes('renderMembers([...(response.chief||[]),...(response.members||[])])'));
 assert.ok(s.includes('renderInvitations(response.invitations||[])'));
});

test("Total and active management counters include Chief while directory remains separate",()=>{
 const html=read("apps/management/integrated-auth-preview.html");
 const js=read("apps/management/auth-client-isolated.js");
 assert.ok(html.includes("Total Management Members"));
 assert.ok(html.includes("Includes the Chief Administrator and all team members"));
 assert.ok(html.includes("Active Management Members"));
 assert.ok(!html.includes("Excludes the protected Chief Administrator"));
 assert.ok(js.includes('$("team-total").textContent=members.length;'));
 assert.ok(js.includes('$("team-active").textContent=members.filter(x=>x.status==="active").length;'));
 assert.ok(js.includes('const team=members.filter(m=>m.role!=="chief_admin")'));
 assert.ok(js.includes('visible("chief-administrator-card",Boolean(chief))'));
});
