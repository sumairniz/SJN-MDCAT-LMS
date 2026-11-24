"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("Content Studio V4 establishes the SJN-branded responsive workspace without replacing editor modules",()=>{
  const html=read("apps/management/index.html");
  const activePreview=read("apps/management/integrated-auth-preview.html");
  const css=read("apps/management/content-studio.css");
  const app=read("apps/management/app.js");
  assert.match(html,/<header class="studio-page-intro">/);
  assert.match(activePreview,/<header class="studio-page-intro">/);
  assert.match(activePreview,/data-studio-target="browse"/);
  assert.match(activePreview,/Live Library/);
  assert.doesNotMatch(activePreview,/Browse &amp; Edit/);
  assert.match(html,/Question Content Studio/);
  assert.match(html,/data-studio-target="drafts"/);
  assert.match(html,/data-studio-target="browse"/);
  assert.match(html,/data-studio-target="import"/);
  assert.match(css,/SJN Content Studio V4/);
  assert.match(css,/\.studio-page-intro/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/@media\(max-width:900px\)/);
  assert.match(css,/var\(--red\)/);
  assert.match(app,/key === "questions"/);
  assert.match(html,/id="studio-editor-form"/);
  assert.match(html,/id="mcq-lib-edit-form"/);
  assert.match(html,/id="studio-file"/);
});

test("V4 keeps publication and student LMS actions outside the redesigned authoring shell",()=>{
  const html=read("apps/management/index.html");
  const ui=read("apps/management/content-studio.js");
  const library=read("apps/management/mcq-library.js");
  assert.match(html,/Nothing here publishes directly to students/);
  assert.match(ui,/Student publication remains disabled/);
  assert.match(library,/save_draft/);
  assert.doesNotMatch(library,/"mcqs\.publish"/);
});
