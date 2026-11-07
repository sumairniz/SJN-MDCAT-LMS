"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const taxonomy=require("../apps/management/content-studio-taxonomy.js");
const excel=require("../apps/management/content-studio-xlsx.js");
const core=require("../apps/management/content-studio-core.js");
const get=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const cat=taxonomy.catalogue([
 {subject:"Biology",chapter:"Biological Molecules",topic:"Importance of Water",usage_count:11},
 {subject:"Biology",chapter:"Biological Molecules",topic:"Carbohydrates",usage_count:24},
 {subject:"Biology",chapter:"Bioenergetics",topic:"Krebs Cycle",usage_count:4},
 {subject:"Physics",chapter:"Waves",topic:"Sound Waves",usage_count:6},
 {subject:"English",chapter:"Verb",topic:"Verb",usage_count:6}
]);
test("Exact taxonomy reuse ignores capitalization and repeated spaces without altering real labels",()=>{
 const x=taxonomy.resolve({subject:"BIOLOGY",chapter:"biological   molecules",topic:"importance OF water"},cat);
 assert.equal(x.status,"matched");
 assert.equal(x.subject.canonical,"Biology");
 assert.equal(x.chapter.canonical,"Biological Molecules");
 assert.equal(x.topic.canonical,"Importance of Water");
});
test("Similar spellings only suggest — never silently map an MCQ to a different topic",()=>{
 const x=taxonomy.resolve({subject:"Biology",chapter:"Biological Molecules",topic:"Carbohydratess"},cat);
 assert.equal(x.status,"blocked");
 assert.equal(x.topic.status,"suggestion");
 assert.ok(x.topic.candidates.some(y=>y.label==="Carbohydrates"));
 assert.equal(x.topic.canonical,undefined);
});
test("Wrong subject/chapter is not silently matched across scopes",()=>{
 const x=taxonomy.resolve({subject:"Physics",chapter:"Waves",topic:"Krebs Cycle"},cat);
 assert.equal(x.status,"blocked");
 assert.equal(x.topic.status,"new");
 const y=taxonomy.resolve({subject:"Biology",chapter:"Unknown Chapter",topic:"Krebs Cycle"},cat);
 assert.equal(y.status,"blocked");
 assert.equal(y.chapter.status,"new");
});
test("Explicit selection can choose an existing suggestion but cannot mint new topics",()=>{
 const entry={subject:"Biology",chapter:"Biological Molecules",topic:"Carbohydratess",question:"Original paper text"};
 const result=taxonomy.resolve(entry,cat);
 const corrected=taxonomy.applySelection(entry,result,{topic:"Carbohydrates"});
 assert.equal(corrected.topic,"Carbohydrates");
 assert.equal(corrected.question,"Original paper text");
 assert.throws(()=>taxonomy.applySelection(entry,result,{topic:"New Unknown Topic"}),/Existing topic/);
});
test("Only existing scoped topic choices may be selected; unknown subjects stop matching",()=>{
 const x=taxonomy.resolve({subject:"Biology",chapter:"BIOLOGICAL MOLECULES",topic:"carbohydrates"},cat);
 assert.equal(x.status,"matched");
 const y=taxonomy.resolve({subject:"Astronomy",chapter:"Stars",topic:"Gas"},cat);
 assert.equal(y.status,"blocked");
 assert.equal(y.chapter,null);
});
test("XLSX-to-CSV pad optional empty cells and quote commas/quotes/newlines",()=>{
 const input=[["bank","subject","chapter"],["Past Papers Question Bank","Biology"],["SJN Question Bank","Chemistry","Atoms,\" and more\nline"]];
 const csv=excel.toCSV(input);
 const rows=core.parseCSV(csv);
 assert.equal(rows.length,3);
 assert.equal(rows[1].length,3);
 assert.equal(rows[1][2],"");
 assert.equal(rows[2][2],"Atoms,\" and more\nline");
});
test("XLSX and taxonomy scripts contain no arbitrary remote code or direct DB writes",()=>{
 const x=get("apps/management/content-studio-xlsx.js");
 const y=get("apps/management/content-studio-taxonomy.js");
 const ui=get("apps/management/content-studio.js");
 const html=get("apps/management/integrated-auth-preview.html");
 assert.ok(x.includes("DecompressionStream"));
 assert.ok(x.includes("Unsupported Excel compression"));
 assert.ok(x.includes("Excel formulas must be replaced"));
 assert.ok(x.includes("Encrypted Excel files are not supported"));
 assert.ok(!x.includes("supabase.co"));
 assert.ok(!x.includes("https://"));
 assert.ok(!y.includes("supabase.co"));
 assert.ok(html.includes('src="/content-studio-xlsx.js"'));
 assert.ok(html.includes('src="/content-studio-taxonomy.js"'));
 assert.ok(html.includes('id="studio-taxonomy-editor"'));
 assert.ok(ui.includes('Match Existing Topic'));
 assert.ok(ui.includes('canonicalizeExact('));
 assert.ok(ui.includes('loadTaxonomy()'));
});
test("Metadata snapshot is taxonomy-only, no question statements, answers or student identifiers",()=>{
 const data=JSON.parse(get("apps/management/content-studio-taxonomy-snapshot.json"));
 assert.equal(data.format,"SJN-MEDNEST-TAXONOMY-SNAPSHOT-v1");
 assert.ok(data.entries.length>300);
 assert.ok(data.entries.every(x=>Object.keys(x).sort().join(",")==="chapter,subject,topic,usage_count"));
 assert.ok(data.entries.every(x=>!Object.keys(x).some(k=>/question|answer|correct|email|user_id|token/.test(k))));
});

test("Bulk topic correction proposals are scoped and never mutate student MCQs",()=>{
 const template=taxonomy.RENAME_HEADERS.join(",")+"\n"+
 "Biology,Biological Molecules,Carbohydrates,Carbohydratess,Textbook typo\n"+
 "Biology,Biological Molecules,Importance of Water,Carbohydrates,merge conflict\n"+
 "Biology,Bioenergetics,Krebs Cycle,Krebs cycle,cosmetic\n"+
 "Physics,Waves,Krebs Cycle,Krebs Cyle,wrong chapter\n";
 const plan=taxonomy.reviewRenamePlan(template,cat,core.parseCSV);
 assert.equal(plan.length,4);
 assert.equal(plan[0].status,"proposed");
 assert.equal(plan[1].status,"invalid");
 assert.ok(plan[1].problems.some(x=>x.includes("Target already exists")));
 assert.equal(plan[2].status,"invalid");
 assert.ok(plan[2].problems.some(x=>x.includes("No rename required")));
 assert.equal(plan[3].status,"invalid");
 assert.ok(plan[3].problems.some(x=>x.includes("Existing topic not found")));
 const output=taxonomy.exportRenamePlan(plan);
 assert.equal(output.purpose,"review_only_no_database_changes");
 assert.equal(output.rows.length,4);
 assert.ok(!get("apps/management/content-studio-taxonomy.js").includes("supabase.co"));
});
