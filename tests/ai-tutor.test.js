'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const ai=require('../lib/ai-tutor');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const js=fs.readFileSync(path.join(root,'public/sjn-ai-tutor.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public/sjn-ai-tutor.css'),'utf8');

test('SJN AI Tutor has standalone routes with no core exam dependency',()=>{
 assert.match(server,/registerAiTutorRoutes\(app, auth\)/);
 assert.match(server,/require\('\.\/lib\/ai-tutor'\)/);
 assert.doesNotMatch(server,/app\.post\('\/api\/ai\/tutor', auth/);
 assert.match(html,/window\.SJNAITutorBridge = /);
 assert.match(html,/modName === 'aitutor'\) void window\.SJNAITutor\?\.enter\(\)/);
 assert.match(html,/window\.SJNAITutor\?\.reset\(\)/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|indexedDB|document\.cookie/);
 assert.doesNotMatch(js,/practice-results|\/api\/content|test-history|MCQHistory/);
});
test('AI chat uses a single consistent name and avoids XSS via textContent',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.match(html,/<h2>SJN AI Tutor<\/h2>/);
 assert.doesNotMatch(html,/SJN AI Medical Assistant|Gemini 3 Flash|AI Doubt Solver/);
 assert.match(js,/body\.textContent=text/);
 assert.match(js,/body\.textContent=value/);
 assert.match(js,/slice\(-8\)/);
 assert.match(html,/id="sjn-ai-mic"/);
 assert.match(html,/id="sjn-ai-composer"/);
 assert.match(css,/#module-aitutor/);
 assert.match(css,/@media\(max-width:767px\)/);
});
test('System instructions are textbook-sensitive but do not pretend to have source access',()=>{
 assert.match(ai.SYSTEM_INSTRUCTIONS,/Sindh \(STB\).*Punjab \(PTB\).*Federal \(FTB\)/);
 assert.match(ai.SYSTEM_INSTRUCTIONS,/Never invent textbook quotations/);
 assert.match(ai.SYSTEM_INSTRUCTIONS,/Physics: use formulas/);
 assert.match(ai.SYSTEM_INSTRUCTIONS,/not repeatedly greet/);
});
test('Strict validation of untrusted conversation history',()=>{
 assert.deepEqual(ai.validHistory(undefined),[]);
 assert.equal(ai.validHistory({}),null);
 assert.equal(ai.validHistory(Array(13).fill({role:'user',text:'x'})),null);
 assert.equal(ai.validHistory([{role:'assistant',text:'x'}]),null);
 assert.equal(ai.validHistory([{role:'user',text:' '.repeat(4)}]),null);
 assert.deepEqual(ai.validHistory([{role:'user',text:'  okay  '}]),[{role:'user',parts:[{text:'okay'}]}]);
 assert.equal(ai.validHistory([{role:'model',text:'x'.repeat(3401)}]),null);
 assert.equal(ai.readGeminiText({candidates:[{content:{parts:[{text:'First'},{text:'Second'}]}}]}),'First\nSecond');
});
test('Unconfigured API has a private, fail-closed status and no provider call',async()=>{
 const previous=process.env.GEMINI_API_KEY,previousEnabled=process.env.SJN_AI_ENABLED;
 delete process.env.GEMINI_API_KEY;
 delete process.env.SJN_AI_ENABLED;
 const endpoints=new Map();
 ai.registerAiTutorRoutes({
  get:(p,auth,handler)=>endpoints.set('GET '+p,handler),
  post:(p,auth,handler)=>endpoints.set('POST '+p,handler)
 },()=>{});
 const response=()=>({
  statusCode:200,
  headers:{},
  set(name,value){this.headers[name]=value;return this},
  status(code){this.statusCode=code;return this},
  json(data){this.data=data;return this}
 });
 try{
  const status=response();
  endpoints.get('GET /api/ai/status')({user:{id:'student'}},status);
  assert.equal(status.data.available,false);
  assert.equal(status.headers['Cache-Control'],'no-store');
  assert.equal(status.data.service,'SJN AI Tutor');
  assert.equal(JSON.stringify(status.data).includes('GEMINI_API_KEY'),false);
  const result=response();
  await endpoints.get('POST /api/ai/tutor')({body:{prompt:'hello'},user:{id:'student'}},result);
  assert.equal(result.statusCode,503);
  assert.match(result.data.error,/not available/);
  process.env.SJN_AI_ENABLED='0';process.env.GEMINI_API_KEY='fake-insecure-key';
  const disabled=response();
  endpoints.get('GET /api/ai/status')({user:{id:'student'}},disabled);
  assert.equal(disabled.data.available,false);
 }finally{
  if(previous===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=previous;
  if(previousEnabled===undefined)delete process.env.SJN_AI_ENABLED;else process.env.SJN_AI_ENABLED=previousEnabled;
 }
});
