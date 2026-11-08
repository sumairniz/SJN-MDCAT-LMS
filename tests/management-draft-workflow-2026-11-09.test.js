"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base=path.resolve(__dirname,"../apps/management");
const file=p=>fs.readFileSync(path.join(base,p),"utf8");
const html=file("integrated-auth-preview.html"),ui=file("content-studio.js"),
 storage=file("content-studio-storage.js"),mcq=file("mcq-library.js"),
 activity=file("auth-client-isolated.js");
test("teacher-first draft workspace retains all basic controls without duplicate identifiers",()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ["studio-batch-name","studio-new","studio-new-set","studio-save-next",
  "studio-save-batch","studio-saved-batches","studio-review-submit",
  "studio-direct-prepare","studio-withdraw-review","studio-batch-state",
  "review-new-batch-list","audit-period","audit-action-filter","audit-refresh"]){
  assert.ok(ids.includes(id),"Missing "+id);
 }
});
test("multiquiz draft editor carries course-independent subject and chapter context",()=>{
 assert.match(ui,/last\.chapter/);
 assert.match(ui,/last\.topic/);
 assert.match(ui,/studio-save-next/);
 assert.match(ui,/requestSubmit\(\)/);
 assert.match(ui,/dirty=false/);
 assert.match(ui,/Save all question edits securely before selecting/);
 assert.match(ui,/pending_review/);
 assert.match(ui,/approved_for_release/);
});
test("review routing only prepares unpublished release and prevents editing submitted batches",()=>{
 for(const action of ["batch.submit_review","batch.prepare_direct","batch.withdraw_review"]){
  assert.ok(storage.includes(action));
 }
 assert.ok(!storage.includes("student.supabase"));
 assert.ok(!storage.includes("mcqs.insert"));
 assert.ok(!storage.includes("publishMCQ"));
 assert.match(ui,/changeRoute\("direct"\)/);
});
test("topic is visible in existing question result and draft classification",()=>{
 assert.match(mcq,/mcq\.topic/);
 assert.match(ui,/item\.entry\.topic/);
 assert.ok(html.includes("Subject → Chapter → Topic"));
});
test("Activity Center displays server-provided events and avoids invented MCQ totals",()=>{
 assert.match(activity,/manage\("audit\.list",\{period/);
 assert.match(activity,/event\.actor/);
 assert.match(activity,/audit-event-list/);
 assert.match(activity,/Counts represent audit events, not unique MCQs/);
 assert.ok(html.includes("Academy Activity Center"));
});
test("advanced taxonomy tools remain available but out of everyday workflow",()=>{
 assert.ok(html.includes('<details class="studio-panel studio-advanced"'));
 assert.ok(html.includes('id="studio-rename-template"'));
});
