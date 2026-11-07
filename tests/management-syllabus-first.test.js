"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");

test("Syllabus is independent of provisional MCQ-assigned chapter and topic data",()=>{
 const sql=read("database/management/isolated-syllabus-first-manager-20261107.sql");
 assert.match(sql,/create table if not exists public\.mednest_syllabus_nodes/);
 assert.match(sql,/id uuid primary key default gen_random_uuid\(\)/);
 assert.match(sql,/parent_id uuid references public\.mednest_syllabus_nodes/);
 assert.match(sql,/state text not null default 'draft'/);
 assert.match(sql,/check\(kind in \('subject','chapter','topic'\)\)/);
 assert.match(sql,/name_key text generated always as/);
 assert.match(sql,/mednest_syllabus_unique_live_siblings/);
 assert.match(sql,/alter table public\.mednest_syllabus_nodes enable row level security/);
 assert.match(sql,/revoke all on public\.mednest_syllabus_nodes from public,anon,authenticated/);
 assert.match(sql,/grant select,insert,update on public\.mednest_syllabus_nodes to service_role/);
 assert.ok(!sql.includes("update public.mcqs"));
 assert.ok(!sql.includes("delete from public.mcqs"));
 assert.ok(!sql.includes("aozknkrwafowsrehdwlr"));
});

test("Server-side mutations recheck live Chief session, keep hierarchy and audit",()=>{
 const sql=read("database/management/isolated-syllabus-first-manager-20261107.sql");
 assert.match(sql,/mednest_staff_session_live\(p_actor,p_session\)/);
 assert.match(sql,/m\.technical_role='chief_admin' and m\.status='active'/);
 assert.match(sql,/syllabus_parent_kind_mismatch/);
 assert.match(sql,/cannot_activate_under_inactive_parent/);
 assert.match(sql,/syllabus_kind_immutable/);
 assert.match(sql,/syllabus\.'\|\|p_action/);
 assert.match(sql,/with recursive tree as/);
 assert.match(sql,/state='archived',updated_by=p_actor/);
 assert.ok(!sql.includes("delete from public.mednest_syllabus_nodes"));
 assert.match(sql,/revoke all on function public\.mednest_syllabus_change/);
 assert.match(sql,/to service_role/);
});

test("Bulk syllabus upload allows 100-row atomic drafts without student data",()=>{
 const sql=read("database/management/isolated-syllabus-first-manager-20261107.sql");
 assert.match(sql,/mednest_syllabus_stage_outline/);
 assert.match(sql,/jsonb_array_length\(p_rows\)>100/);
 assert.match(sql,/values\('subject',v_subject,p_actor,p_actor\)/);
 assert.match(sql,/values\('chapter',v_sid,v_chapter,p_actor,p_actor\)/);
 assert.match(sql,/values\('topic',v_cid,v_topic,p_actor,p_actor\)/);
 assert.match(sql,/on conflict do nothing/);
 assert.match(sql,/syllabus\.outline_staged/);
});

test("Syllabus Edge only accepts active Chief from independent management identity",()=>{
 const api=read("database/management/mednest-syllabus/index.ts");
 assert.match(api,/tdqbjhrmfluiinntmjfh/);
 assert.match(api,/const OPERATIONS=new Set\(\["syllabus.list","syllabus.change","syllabus.stage"\]\)/);
 assert.match(api,/db\.auth\.getUser\(token\)/);
 assert.match(api,/mednest_staff_session_live/);
 assert.match(api,/member\.technical_role!=="chief_admin"/);
 assert.match(api,/member\.status!=="active"/);
 assert.match(api,/mednest_syllabus_change/);
 assert.match(api,/mednest_syllabus_stage_outline/);
 assert.match(api,/body\.rows\.length>100/);
 assert.match(api,/limit|range\(offset,offset\+199\)/);
 assert.ok(!api.includes("aozknkrwafowsrehdwlr"));
 assert.ok(!api.includes('"publish"'));
 assert.ok(!api.includes("student_mcqs"));
});

test("Protected Management Panel offers direct syllabus editing, safe archive, CSV/Excel and paste",()=>{
 const html=read("apps/management/integrated-auth-preview.html");
 const js=read("apps/management/syllabus-manager.js");
 const app=read("apps/management/app.js");
 assert.ok(html.includes('data-module="syllabus"'));
 assert.ok(html.includes('id="syllabus-manager"'));
 assert.ok(html.includes('id="syllabus-paste"'));
 assert.ok(html.includes('id="syllabus-rename"'));
 assert.ok(html.includes('id="syllabus-archive"'));
 assert.ok(html.includes('id="syllabus-restore"'));
 assert.ok(html.includes('id="syllabus-activate"'));
 assert.ok(html.includes('src="/syllabus-manager.js"'));
 assert.ok(app.includes('key !== "syllabus"'));
 assert.ok(js.includes('window.MedNestSyllabus'));
 assert.ok(js.includes('getActiveEntries'));
 assert.ok(js.includes('mednest:syllabus-updated'));
 assert.ok(js.includes('mednest:signed-out'));
 assert.ok(js.includes('window.confirm('));
 assert.ok(js.includes('window.MedNestXLSX'));
 assert.ok(js.includes('syllabus.import')===false);
 assert.ok(js.includes('syllabus.stage'));
 assert.ok(js.includes('preview=[];$("syllabus-import").disabled=true;'));
});

test("Old provisional MCQ taxonomy snapshot is no longer loaded by Content Studio",()=>{
 const js=read("apps/management/content-studio.js");
 assert.ok(js.includes('window.MedNestSyllabus?.getActiveEntries?.()'));
 assert.ok(js.includes('mednest:syllabus-updated'));
 assert.ok(!js.includes('fetch("/content-studio-taxonomy-snapshot.json"'));
 assert.ok(js.includes('No approved Academy syllabus topics yet.'));
 const html=read("apps/management/integrated-auth-preview.html");
 assert.ok(html.includes("owner-managed approved Academy syllabus"));
});
