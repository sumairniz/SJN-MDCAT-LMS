(()=>{
'use strict';
// AI-only, text-node-based rendering. Never parse model-provided HTML.
const CSS_URL='https://cdn.jsdelivr.net/npm/katex@0.19.1/dist/katex.min.css';
const JS_URL='https://cdn.jsdelivr.net/npm/katex@0.19.1/dist/katex.min.js';
const CSS_SRI='sha384-WwGtaC6ywCHxA5cstpj/3+xIZvTez8dq2IcBQaXRkenHZ7FVVq1ZROtURwfbtTlG';
const JS_SRI='sha384-a1WQdjRj162i159OYq041X6I4K8NenkrI09LlPmiHg0YOb7CR+wJOraXwK9abpnE';
let mathLoading=null;
function loadMath(){
 if(window.katex)return Promise.resolve(true);
 if(mathLoading)return mathLoading;
 mathLoading=new Promise(resolve=>{
  const css=document.createElement('link');
  css.rel='stylesheet';css.href=CSS_URL;css.integrity=CSS_SRI;css.crossOrigin='anonymous';
  document.head.append(css);
  const script=document.createElement('script');
  script.src=JS_URL;script.async=true;script.integrity=JS_SRI;script.crossOrigin='anonymous';
  script.onload=()=>resolve(Boolean(window.katex));
  script.onerror=()=>resolve(false);
  document.head.append(script);
 });
 return mathLoading;
}
function node(tag,cls){const el=document.createElement(tag);if(cls)el.className=cls;return el}
function text(parent,s){parent.append(document.createTextNode(s))}
function renderMath(parent,formula,display){
 const el=node(display?'div':'span',display?'sjn-ai-math-block':'sjn-ai-math-inline');
 const value=formula.trim();
 if(window.katex&&value.length<3500){
  try{window.katex.render(value,el,{displayMode:display,throwOnError:false,trust:false,maxExpand:500,maxSize:8,strict:'ignore'})}
  catch(e){el.textContent=value}
 }else el.textContent=value;
 parent.append(el);
}
const INLINE=/(\\\([^\n]+?\\\)|\$(?!\$)[^$\n]{1,700}\$(?!\$)|\*\*[^*\n]+\*\*|__[^_\n]+__|\x60[^\x60\n]+\x60|\*[^*\n]+\*|_[^_\n]+_)/g;
function inline(parent,value){
 const raw=String(value||'');
 let last=0;
 for(const match of raw.matchAll(INLINE)){
  if(match.index>last)text(parent,raw.slice(last,match.index));
  const part=match[0],strong=part.startsWith('**')||part.startsWith('__');
  if(part.startsWith('\\('))renderMath(parent,part.slice(2,-2),false);
  else if(part.startsWith('$'))renderMath(parent,part.slice(1,-1),false);
  else if(part.charCodeAt(0)===96){const code=node('code');code.textContent=part.slice(1,-1);parent.append(code)}
  else{const el=node(strong?'strong':'em');inline(el,part.slice(strong?2:1,strong?-2:-1));parent.append(el)}
  last=match.index+part.length;
 }
 if(last<raw.length)text(parent,raw.slice(last));
}
function render(target,answer){
 const raw=String(answer||'').replace(/\r\n?/g,'\n').slice(0,25000);
 target.replaceChildren();
 const lines=raw.split('\n');
 let list=null,listType='';
 function clearList(){list=null;listType=''}
 function isBlock(v){return /^\s*(?:#{1,5}\s+|[-*_]{3,}\s*$|>\s?|[-*+]\s+|\d+[.)]\s+|\x60{3}|~{3}|\$\$|\\\[)/.test(v)}
 let i=0;
 while(i<lines.length){
  const line=lines[i],value=line.trim();
  if(!value){clearList();i++;continue}
  if(/^(\x60{3,}|~{3,})/.test(value)){
   clearList();const fence=value.slice(0,3),code=[];
   i++;
   while(i<lines.length&&!lines[i].trim().startsWith(fence))code.push(lines[i++]);
   if(i<lines.length)i++;
   const pre=node('pre','sjn-ai-code'),child=node('code');child.textContent=code.join('\n');pre.append(child);target.append(pre);continue;
  }
  if(value.startsWith('$$')||value.startsWith('\\[')){
   clearList();const left=value.startsWith('$$')?'$$':'\\[',right=left==='$$'?'$$':'\\]';
   let formula=value.slice(left.length);
   while(!formula.includes(right)&&i+1<lines.length&&formula.length<3500)formula+='\n'+lines[++i];
   if(formula.includes(right))formula=formula.slice(0,formula.indexOf(right));
   const div=node('div','sjn-ai-math-wrapper');renderMath(div,formula,true);target.append(div);i++;continue;
  }
  const heading=/^(#{1,5})\s+(.+)$/.exec(value);
  if(heading){clearList();const h=node(heading[1].length<3?'h3':'h4');inline(h,heading[2]);target.append(h);i++;continue}
  if(/^([-*_])(?:\s*\1){2,}\s*$/.test(value)){clearList();target.append(node('hr'));i++;continue}
  const bullet=/^\s*[-*+]\s+(.+)$/.exec(line);
  const numbered=/^\s*\d+[.)]\s+(.+)$/.exec(line);
  if(bullet||numbered){
   const tag=bullet?'ul':'ol';
   if(!list||listType!==tag){list=node(tag);listType=tag;target.append(list)}
   const li=node('li');inline(li,(bullet||numbered)[1]);list.append(li);i++;continue;
  }
  if(/^>\s?/.test(value)){
   clearList();const block=node('blockquote');inline(block,value.replace(/^>\s?/,''));target.append(block);i++;continue;
  }
  clearList();const paras=[value];
  while(i+1<lines.length&&lines[i+1].trim()&&!isBlock(lines[i+1]))paras.push(lines[++i].trim());
  const p=node('p');inline(p,paras.join(' '));target.append(p);i++;
 }
 if(!target.childNodes.length){const p=node('p');p.textContent=raw;target.append(p)}
 target._sjnAnswerRaw=answer;
 if(!window.katex&&(raw.includes('$$')||raw.includes('\\(')||raw.includes('\\[')||/\$[^$\n]{1,200}\$/.test(raw))){
  void loadMath().then(ok=>{
   if(ok&&target.isConnected&&target._sjnAnswerRaw===answer)render(target,answer);
  });
 }
}
window.SJNAIFormat={render};
})();