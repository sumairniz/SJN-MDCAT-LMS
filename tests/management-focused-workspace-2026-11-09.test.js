"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=pathName=>fs.readFileSync(path.join(root,pathName),"utf8");
const html=read("apps/management/integrated-auth-preview.html");
const ui=read("apps/management/content-studio.js");
const css=read("apps/management/content-studio.css");
const bridge=read("apps/management/content-studio-storage.js");
const backend=read("database/management/mednest-content-studio/index.ts");
test("focused workspace has unique controls with no duplicated editor",()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ["studio-focus-workspace","studio-focus-editor-stage","studio-focus-questions","studio-focus-add",
  "studio-focus-save","studio-focus-search","studio-focus-prev","studio-focus-next","studio-focus-readonly",
  "studio-focus-back","studio-nav-drafts","studio-nav-browse","studio-nav-import"]){
  assert.ok(ids.includes(id),"Missing "+id);
 }
 assert.equal(ids.filter(id=>id==="studio-editor").length,1);
 assert.ok(ui.includes('append($("studio-editor"))'),"Reuse existing secure editor instead of cloning it");
});
test("focused draft browsing uses real tab views, paged question navigation and responsive layout",()=>{
 for(const fragment of ["function setStudioView(view)","function renderFocus()","function openFocusedLine(line)",
  "function exitFocus()","function openWorkspace(","focusPage","focusQuery","FOCUS_PAGE_SIZE=24","Inspect Questions"]){
  assert.ok(ui.includes(fragment),"Missing "+fragment);
 }
 assert.match(css,/#content-studio-preview\[data-studio-view="focus"\]/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(html,/data-studio-page="browse"/);
 assert.match(html,/data-studio-page="import"/);
});
test("manual MCQ save persists to protected Management service before showing confirmed success",()=>{
 assert.match(ui,/async function saveDraftItems\(/);
 assert.match(ui,/await saveDraftItems\(items/);
 assert.match(ui,/drafts=updatedRows;selected=-1/);
 assert.match(ui,/if\(next\)\$\("studio-new"\)\.click\(\)/);
 assert.match(ui,/saveInFlight/);
 assert.match(ui,/try\{await reloadBatchList\(\)/);
 assert.match(bridge,/await call\("batch\.save_rows"/);
 assert.ok(!bridge.includes("aozknkrwafowsrehdwlr"));
 assert.ok(!bridge.includes("STUDENT_SUPABASE"));
 assert.ok(!ui.includes('localStorage.setItem("draft'));
});
test("changing drafts warns only for real unsaved work, not merely saved questions existing",()=>{
 assert.match(ui,/dirty\|\|formChanged\(\)/);
 assert.ok(ui.includes("Your current draft has unsaved changes."));
 assert.ok(ui.includes("You have unsaved changes in the existing MCQ editor."));
 assert.doesNotMatch(ui,/if\(drafts\.length&&!window\.confirm\("Replace current browser drafts/);
 assert.match(ui,/function askAbandonForm\(\)/);
});
test("Academic Review opens read-only inspection, not a second editable draft",()=>{
 assert.match(ui,/cell\("button","Inspect Questions"/);
 assert.match(ui,/await openSavedBatch\(batch\.id,\{inspect:true\}\)/);
 assert.match(ui,/show\("studio-focus-readonly",true\)/);
 assert.match(ui,/if\(inspectMode\|\|locked\(\)\)focusReadOnlyQuestion/);
 assert.ok(html.includes('id="review-new-batch-list"'));
});
test("student release stays disabled and option E blocks release-ready until LMS compatibility",()=>{
 assert.match(backend,/requireReleaseReady&&f\.option_e\?\.trim\(\)/);
 assert.match(backend,/validateStoredRows\(direct\)/);
 assert.match(backend,/validateStoredRows\(true\)/);
 assert.match(backend,/published:false/);
 assert.doesNotMatch(backend,/from\("mcqs"\)\.insert/);
});
