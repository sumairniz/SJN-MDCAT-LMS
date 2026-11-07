"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const core=require("../apps/management/content-studio-core.js");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const example=()=>({bank:"Past Papers Question Bank",subject:"Biology",chapter:"Biological Molecules",
 topic:"Importance of Water",question:"Which property matters?",
 option_a:"Adhesion",option_b:"Cohesion",option_c:"Surface tension",option_d:"Polarity",
 correct_option:"B",explanation:"Textbook explanation",mnemonic:"",
 source:"UHS 2025",region:"punjab",year:"2025",paper_code:""});
test("Content Studio uses the two approved ordinary question banks and five subjects",()=>{
 assert.deepEqual(core.BANKS,["SJN Question Bank","Past Papers Question Bank"]);
 assert.deepEqual(core.SUBJECTS,["Biology","Chemistry","Physics","English","Logical Reasoning"]);
});
test("CSV parser handles RFC-style quoting, embedded newlines, CRLF and BOM",()=>{
 const csv=core.HEADERS.join(",")+"\r\n"+
  ['"Past Papers Question Bank"','"Biology"','"Biological Molecules"',
   '"Importance of Water"','"Which property is \"\"important\"\"?\nThink again."',
   '"Adhesion"','"Cohesion"','"Surface tension"','"Polarity"','"B"',
   '"Because water has high polarity."','""','"UHS 2025"','"punjab"','"2025"','""'].join(",")+"\r\n";
 const result=core.importCSV("\ufeff"+csv);
 assert.equal(result.length,1);
 assert.ok(result[0].entry.question.includes('"important"'));
 assert.ok(result[0].entry.question.includes("\n"));
 assert.deepEqual(core.validate(result[0].entry).errors,[]);
});
test("Reject missing header, mismatched fields, unclosed quotes and oversized input",()=>{
 assert.throws(()=>core.importCSV("bank,question\nX,Hello"),/Missing required/);
 assert.throws(()=>core.parseCSV('"unterminated'),/unclosed quoted/);
 const csv=core.HEADERS.join(",")+"\n"+Array(core.HEADERS.length-1).fill("x").join(",")+"\n";
 const entry=core.importCSV(csv)[0].entry;
 assert.ok(core.validate(entry).errors.some(x=>x.includes("Column count mismatch")));
 assert.throws(()=>core.parseCSV("x".repeat(core.MAX_FILE_CHARS+1)),/under 7.5 million/);
});
test("Past paper source and correct option mandatory; original text never silently changed",()=>{
 const entry=example();
 assert.deepEqual(core.validate(entry).errors,[]);
 const malformed={...entry,source:"",correct_option:"Z"};
 const result=core.validate(malformed);
 assert.ok(result.errors.some(x=>x.includes("source")));
 assert.ok(result.errors.some(x=>x.includes("A, B, C or D")));
 assert.equal(entry.question,"Which property matters?");
 assert.equal(entry.correct_option,"B");
});
test("Detect duplicates and warnings without silently publishing or altering academic content",()=>{
 const a=example(),b={...a,question:"Which property matters?  ",source:"Different paper"};
 const inspected=core.inspectDrafts([{line:1,entry:a},{line:2,entry:b}]);
 assert.equal(inspected[0].status,"ready");
 assert.equal(inspected[1].status,"review");
 assert.match(inspected[1].warnings.join(" "),/duplicate/i);
 const exportData=core.exportDrafts([{line:1,entry:a}]);
 assert.equal(exportData.purpose,"unpublished_review_only");
 assert.equal(exportData.entries[0].fields.question,a.question);
 assert.equal(exportData.entries[0].proposed_correct_index,1);
 assert.ok(!("id" in exportData.entries[0].fields));
});
test("English and LR taxonomy and duplicate options produce warnings",()=>{
 const x={...example(),subject:"English",chapter:"Verb",topic:"Tenses",
 option_d:"Adhesion"};
 const result=core.validate(x);
 assert.equal(result.errors.length,0);
 assert.ok(result.warnings.some(x=>x.includes("chapter and topic")));
 assert.ok(result.warnings.some(x=>x.includes("Repeated")));
});
test("Professional panel exposes draft-only Content Studio and no direct student Supabase writes",()=>{
 const html=read("apps/management/integrated-auth-preview.html");
 const app=read("apps/management/app.js");
 const ui=read("apps/management/content-studio.js");
 const engine=read("apps/management/content-studio-core.js");
 assert.ok(html.includes('id="content-studio-preview"'));
 assert.ok(html.includes('src="/content-studio-core.js"'));
 assert.ok(html.includes('src="/content-studio.js"'));
 assert.ok(html.includes('id="studio-editor-form"'));
 assert.ok(app.includes('key !== "questions"'));
 assert.ok(app.includes('key === "questions"'));
 assert.ok(ui.includes('core.importCSV(await file.text())'));
 assert.ok(ui.includes('MedNestXLSX.readXLSX'));
 assert.ok(ui.includes('MedNestXLSX.toCSV'));
 assert.ok(ui.includes('core.exportDrafts(drafts)'));
 assert.ok(ui.includes('const PAGE_SIZE=40'));
 assert.ok(!ui.includes("supabase.co"));
 assert.ok(ui.includes('window.MedNestSyllabus?.getActiveEntries?.()'));
 assert.ok(!ui.includes('fetch("/content-studio-taxonomy-snapshot.json"'));
 assert.ok(!ui.includes("fetch(\"https://"));
 assert.ok(!engine.includes("supabase.co"));
 assert.ok(!engine.includes("fetch("));
 assert.ok(!html.includes('id="studio-publish"'));
});
