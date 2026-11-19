'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ai=require('../lib/ai-tutor');
const folder=path.join(__dirname,'..','public');
const renderer=fs.readFileSync(path.join(folder,'sjn-ai-format.js'),'utf8');
const tutor=fs.readFileSync(path.join(folder,'sjn-ai-tutor.js'),'utf8');
const index=fs.readFileSync(path.join(folder,'index.html'),'utf8');
const css=fs.readFileSync(path.join(folder,'sjn-ai-tutor.css'),'utf8');

function newElement(tag){
 return {
  tag, className:'',children:[],childNodes:[],_text:'',
  append(node){this.children.push(node);this.childNodes=this.children},
  replaceChildren(){this.children=[];this.childNodes=this.children;this._text=''},
  set textContent(value){this._text=String(value);this.children=[];this.childNodes=this.children},
  get textContent(){return this._text+this.children.map(x=>x.textContent||x.value||'').join('')},
  get isConnected(){return false}
 };
}
function boot(){
 const win={};
 const doc={
  createElement:tag=>newElement(tag),
  createTextNode:value=>({value,textContent:value}),
  head:newElement('head')
 };
 vm.runInNewContext(renderer,{window:win,document:doc,Promise,console});
 return {format:win.SJNAIFormat.render};
}
test('AI-only answer renderer supports headings, bullets, emphasis, code, paragraphs, and display math',()=>{
 assert.doesNotThrow(()=>new vm.Script(renderer));
 const {format}=boot(),target=newElement('div');
 format(target,'### **Newton’s second law**\n\n**Formula:** $$F = ma$$\n\n- First point\n- Second point\n\n\x60code\x60 and a conclusion.');
 const headings=target.children.filter(x=>x.tag==='h4');
 assert.equal(headings.length,1);
 assert.equal(headings[0].textContent,'Newton’s second law');
 assert.equal(target.children.filter(x=>x.tag==='ul').length,1);
 assert.match(target.textContent,/First point/);
 assert.match(target.textContent,/F = ma/);
 assert.match(target.textContent,/a conclusion/);
});
test('Unknown HTML in an AI answer stays text rather than creating executable nodes',()=>{
 const {format}=boot(),target=newElement('div');
 format(target,'<img src=x onerror=alert(1)> **important**');
 assert.match(target.textContent,/<img src=x onerror=alert\(1\)>/);
 assert.equal(target.children.filter(x=>x.tag==='img').length,0);
});
test('Only tutor chat loads formatter; it does not affect other LMS modules',()=>{
 const pos=index.indexOf('<script src="/sjn-ai-format.js?');
 const chatPos=index.indexOf('<script src="/sjn-ai-tutor.js?');
 assert.ok(pos>=0&&chatPos>pos);
 assert.match(tutor,/window\.SJNAIFormat\.render\(body,value\)/);
 assert.match(css,/#module-aitutor \.sjn-ai-message-body h3/);
 assert.match(css,/#module-aitutor \.sjn-ai-math-wrapper/);
 assert.doesNotMatch(renderer,/\\.innerHTML\s*=/);
 assert.match(renderer,/trust:false/);
 assert.match(renderer,/integrity=CSS_SRI/);
 assert.match(renderer,/integrity=JS_SRI/);
});
test('Short greetings receive concise generation limits; worked numericals remain detailed',()=>{
 assert.ok(ai.responseTokenBudget('hello') < ai.responseTokenBudget('Explain Newton’s second law'));
 assert.ok(ai.responseTokenBudget('Calculate force in a step-by-step numerical example') >
  ai.responseTokenBudget('Explain Newton’s second law'));
 assert.match(ai.SYSTEM_INSTRUCTIONS,/Match answer length to the request/);
 assert.match(ai.SYSTEM_INSTRUCTIONS,/finish the final sentence/);
});
test('Backend reports a non-silent incomplete answer when Gemini reaches token limit',()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','lib','ai-tutor.js'),'utf8');
 assert.match(src,/finishReason === 'MAX_TOKENS'/);
 assert.match(src,/incomplete: possiblyIncomplete/);
 assert.match(tutor,/data\.incomplete/);
 assert.match(src,/answer\.slice\(0, 18000\)/);
});
