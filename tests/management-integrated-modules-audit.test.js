"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("Protected preview references existing local JS/CSS for all developed modules",()=>{
 const html=read("apps/management/integrated-auth-preview.html");
 const srcs=[...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]);
 const styles=[...html.matchAll(/<link[^>]*\bhref="([^"]+\.css)"/g)].map(m=>m[1]);
 for(const rel of [...srcs,...styles]){
  assert.ok(rel.startsWith("/"),"unexpected script or style reference: "+rel);
  assert.ok(fs.existsSync(path.join(root,"apps/management",rel.slice(1))),"missing local module: "+rel);
 }
 for(const src of ["syllabus-manager.js","content-studio.js","mcq-library.js","academic-review.js"]){
  assert.ok(srcs.includes("/"+src),"missing module "+src);
 }
});
test("All standalone HTML ids are unique and navigation routes resolve",()=>{
 const html=read("apps/management/integrated-auth-preview.html");
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,"duplicate HTML ids");
 const app=read("apps/management/app.js");
 const routes=["questions","syllabus","reviews","team","profile"];
 for(const route of routes){
  assert.ok(html.includes('data-module="'+route+'"'),"nav missing "+route);
  assert.ok(new RegExp("\\b"+route+": \\[\\"").test(app),"route missing "+route);
 }
 assert.ok(app.includes('academicReviewPreview.classList.toggle("is-hidden", key !== "reviews")'));
 assert.ok(app.includes('syllabusManager.classList.toggle("is-hidden", key !== "syllabus")'));
});
test("Academic review UI maintains action locks after async refresh and sign-out",()=>{
 const s=read("apps/management/academic-review.js");
 assert.ok(s.includes('const pending=selected?.state==="pending"'));
 assert.ok(s.includes("selected.author_user_id===actorId"));
 assert.ok(s.includes('$("review-approve").disabled=flag||!pending||own'));
 assert.ok(s.includes('$("review-request-changes").disabled=flag||!pending||own'));
 assert.ok(s.includes('$("review-withdraw").disabled=flag||!pending||!own'));
 assert.ok(s.includes('actorId=null;'));
 assert.ok(s.includes('window.addEventListener("mednest:signed-out"'));
});
test("Ordinary MCQ edits, approvals and syllabus changes remain isolated from student writes",()=>{
 for(const file of ["apps/management/mcq-library.js","apps/management/academic-review.js","apps/management/syllabus-manager.js",
  "apps/management/content-studio.js","apps/management/content-studio-storage.js"]){
  const s=read(file);
  assert.ok(!s.includes('STUDENT_SERVICE_ROLE'),file+" contains student private credential");
  assert.ok(!s.includes("student.from(\"mcqs\").update"),file+" contains direct source mutation");
 }
 const edge=read("database/management/mednest-academic-review/index.ts");
 assert.ok(!edge.includes("aozknkrwafowsrehdwlr"));
 assert.ok(!edge.includes('"review.publish"'));
 assert.ok(edge.includes("publishing_enabled:false"));
});
