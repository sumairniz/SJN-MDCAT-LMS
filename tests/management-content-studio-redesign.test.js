"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("Content Studio redesign adds an Academic Team workspace header without replacing existing workflow controls",()=>{
 const html=read("apps/management/integrated-auth-preview.html");
 const css=read("apps/management/content-studio.css");
 assert.ok(html.includes('class="studio-hero"'));
 assert.ok(html.includes("Question Content Studio"));
 assert.ok(html.includes("Changes here do not publish to students"));
 for(const id of ["studio-view-nav","studio-focus-workspace","mcq-library","studio-editor-form","studio-undo","studio-redo","studio-autosave-status","studio-save","studio-save-next","studio-review-submit","studio-direct-prepare"])
  assert.ok(html.includes('id="'+id+'"'),"missing existing workflow control: "+id);
 assert.ok(css.includes("#content-studio-preview #studio-editor .studio-editor-grid"));
 assert.ok(css.includes("#content-studio-preview #studio-live-preview"));
 assert.ok(css.includes("@media(max-width:1050px)"));
 assert.ok(css.includes("@media(max-width:760px)"));
 assert.ok(css.includes("@media(max-width:520px)"));
});

test("Content Studio loads protected drafts when Management Auth finishes before its deferred script",()=>{
 const auth=read("apps/management/auth-client-isolated.js");
 const ui=read("apps/management/content-studio.js");
 assert.ok(auth.includes('document.documentElement.dataset.managementAuthorized="true"'));
 assert.ok(auth.includes('document.documentElement.dataset.managementAuthorized="false"'));
 assert.ok(ui.includes('if(document.documentElement.dataset.managementAuthorized==="true")refreshAuthorizedDrafts()'));
 assert.ok(ui.includes('window.addEventListener("mednest:authorized",refreshAuthorizedDrafts)'));
});

test("Both Add Question controls invoke the same direct editor action",()=>{
 const ui=read("apps/management/content-studio.js");
 assert.ok(ui.includes('$("studio-focus-add").addEventListener("click",startNewQuestion)'));
 assert.ok(ui.includes('$("studio-new").addEventListener("click",startNewQuestion)'));
 assert.ok(!ui.includes('$("studio-focus-add").addEventListener("click",()=>$("studio-new").click())'));
 assert.ok(ui.includes('show("studio-editor",true);focusFormSnapshot();setStudioView("focus")'));
});

test("Content Studio redesign does not introduce duplicate IDs or teacher-only audience copy",()=>{
 const html=read("apps/management/integrated-auth-preview.html");
 const ids=[...html.matchAll(/\\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,"duplicate HTML IDs");
 const hero=html.slice(html.indexOf('class="studio-hero"'),html.indexOf('class="studio-hero"')+1800);
 assert.ok(!/\\bteacher(s)?\\b/i.test(hero));
});
