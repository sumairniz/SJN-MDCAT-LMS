"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const core=require("../apps/management/content-studio-core.js");
const base=path.join(__dirname,"../apps/management");
const html=fs.readFileSync(path.join(base,"integrated-auth-preview.html"),"utf8");
const source=fs.readFileSync(path.join(base,"mcq-xlsx-template.js"),"utf8");
const requiredColumns=["bank","subject","chapter","topic","question","option_a",
  "option_b","option_c","option_d","option_e","correct_option","source"];
test("existing four-option question remains valid",()=>{
 const item={bank:"SJN Question Bank",subject:"Biology",chapter:"Cells",topic:"Cell organelles",
  question:"Where is ATP produced?",option_a:"A",option_b:"B",option_c:"C",option_d:"D",
  correct_option:"C",source:""};
 assert.deepEqual(core.validate(item).errors,[]);
});
test("optional fifth option is draft-valid only with real E text",()=>{
 const item={bank:"SJN Question Bank",subject:"Physics",chapter:"Waves",topic:"Sound",
  question:"Statements:\nI. Sound needs a medium.\nII. Light propagates in vacuum. → Select.",
  option_a:"I only",option_b:"II only",option_c:"I and II",option_d:"Neither",
  option_e:"Cannot determine",correct_option:"E",source:""};
 const valid=core.validate(item);
 assert.deepEqual(valid.errors,[]);
 assert.equal(valid.correct_index,4);
 assert.ok(valid.warnings.some(x=>x.includes("publishing")));
 assert.ok(core.validate({...item,option_e:""}).errors.length);
});
test("past-paper source is required; academy-authored source optional",()=>{
 const item={bank:"Past Papers Question Bank",subject:"Chemistry",chapter:"Atoms",topic:"Bonding",
  question:"Example",option_a:"A",option_b:"B",option_c:"C",option_d:"D",correct_option:"A"};
 assert.ok(core.validate(item).errors.some(x=>x.includes("source")));
 assert.deepEqual(core.validate({...item,bank:"SJN Question Bank"}).errors,[]);
});
test("both templates round-trip through CSV importer with optional option E",()=>{
 for(const bank of core.BANKS){
  const rows=core.importCSV(core.csvTemplate(bank));
  assert.equal(rows.length,1);
  assert.equal(rows[0].entry.bank,bank);
  assert.equal(rows[0].entry.option_e,"");
  assert.deepEqual(core.validate(rows[0].entry).errors,[]);
 }
 for(const column of requiredColumns)assert.ok(core.HEADERS.includes(column));
});
test("management HTML exposes unique identifiers, tools and both previews",()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ["mcq-lib-search","mcq-lib-live-preview","mcq-lib-change-summary",
  "studio-option_e","studio-template-xlsx","studio-live-preview"]){
  assert.ok(ids.includes(id),"Missing "+id);
 }
 for(const file of ["mcq-xlsx-template.js","mcq-editor-assist.js"]){
  assert.ok(html.includes('src="/'+file+'"'));
  assert.ok(fs.existsSync(path.join(base,file)));
 }
});
test("Excel template generator emits ZIP package with workbook and worksheet",async()=>{
 const context={window:{},Blob,TextEncoder,Uint32Array};
 vm.runInNewContext(source,context,{filename:"mcq-xlsx-template.js"});
 const rows=core.parseCSV(core.csvTemplate("SJN Question Bank"));
 const result=context.window.MedNestXLSXTemplate.create(rows);
 const bytes=Buffer.from(await result.arrayBuffer());
 const names=[];
 let p=0;
 while(p+30<bytes.length&&bytes.readUInt32LE(p)===0x04034b50){
  const len=bytes.readUInt16LE(p+26),extra=bytes.readUInt16LE(p+28),
   size=bytes.readUInt32LE(p+18);
  const name=bytes.toString("utf8",p+30,p+30+len);
  names.push(name);
  const data=bytes.toString("utf8",p+30+len+extra,p+30+len+extra+size);
  if(name==="xl/worksheets/sheet1.xml"){
   assert.ok(data.includes("option_e"));
   assert.ok(data.includes("SJN Question Bank"));
   assert.ok(data.includes("option_a"));
  }
  p+=30+len+extra+size;
 }
 assert.ok(names.includes("xl/workbook.xml"));
 assert.ok(names.includes("xl/_rels/workbook.xml.rels"));
 assert.ok(names.includes("xl/worksheets/sheet1.xml"));
 assert.equal(bytes.readUInt32LE(p),0x02014b50);
});
