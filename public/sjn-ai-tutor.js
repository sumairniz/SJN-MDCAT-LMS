(()=>{
'use strict';
const root=document.getElementById('module-aitutor');
if(!root)return;
const list=root.querySelector('#sjn-ai-messages');
const form=root.querySelector('#sjn-ai-composer');
const input=root.querySelector('#sjn-ai-input');
const send=root.querySelector('#sjn-ai-send');
const mic=root.querySelector('#sjn-ai-mic');
const counter=root.querySelector('#sjn-ai-count');
const message=root.querySelector('#sjn-ai-availability');
const notice=root.querySelector('#sjn-ai-privacy');
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let turns=[],owner=null,generation=0,busy=false,recognition=null,recognizing=false,loadedStatus=false;
const bridge=()=>window.SJNAITutorBridge;
function setBusy(value){busy=!!value;send.disabled=busy||!input.value.trim();input.disabled=busy;root.classList.toggle('sjn-ai-busy',busy)}
function announcement(text,kind='normal'){message.textContent=text;message.dataset.kind=kind}
function scrollBottom(){requestAnimationFrame(()=>{list.scrollTop=list.scrollHeight})}
function addBubble(role,text,{pending=false}={}){
 const row=document.createElement('div');row.className='sjn-ai-message sjn-ai-'+role;
 const avatar=document.createElement('span');avatar.className='sjn-ai-avatar';avatar.setAttribute('aria-hidden','true');avatar.textContent=role==='user'?'You':'✦';
 const bubble=document.createElement('div');bubble.className='sjn-ai-bubble';
 const name=document.createElement('div');name.className='sjn-ai-message-name';name.textContent=role==='user'?'You':'SJN AI Tutor';
 const body=document.createElement('div');body.className='sjn-ai-message-body';body.textContent=text;
 if(role==='model'&&!pending&&window.SJNAIFormat)window.SJNAIFormat.render(body,text);
 if(pending){row.classList.add('sjn-ai-pending');body.setAttribute('role','status')}
 bubble.append(name,body);row.append(avatar,bubble);list.append(row);scrollBottom();
 return {row,body,update(value){body.textContent=value;if(role==='model'&&window.SJNAIFormat)window.SJNAIFormat.render(body,value);row.classList.remove('sjn-ai-pending');scrollBottom()},remove(){row.remove()}};
}
function reset(){
 generation++;owner=null;turns=[];loadedStatus=false;
 if(recognition){try{recognition.stop()}catch(_){}}recognition=null;recognizing=false;mic.classList.remove('is-listening');
 list.replaceChildren();
 const intro=document.createElement('div');intro.className='sjn-ai-welcome';
 intro.innerHTML='<div class="sjn-ai-welcome-icon" aria-hidden="true">✦</div><h3>Assalamu Alaikum, future doctor! <span aria-hidden="true">👋</span></h3><p>I’m your SJN AI Tutor. Bring me a tricky Biology fact, a Physics numerical, or a Chemistry MCQ. We’ll figure it out together, one concept at a time.</p>';
 list.append(intro);setBusy(false);input.value='';updateCount();announcement('Checking tutor availability…');notice.hidden=false;
}
function updateCount(){counter.textContent=input.value.length+' / 2200';send.disabled=busy||!input.value.trim()}
async function enter(){
 const uid=bridge()?.userId?.();if(!uid)return;
 if(owner!==uid){reset();owner=uid}
 if(loadedStatus)return;
 loadedStatus=true;
 const ticket=generation;
 try{
  const data=await bridge().load('/ai/status');
  if(owner!==uid||ticket!==generation)return;
  announcement(data.message||'Tutor status available.',data.available?'ready':'offline');
  root.classList.toggle('sjn-ai-offline',!data.available);
 }catch(e){
  if(owner===uid&&ticket===generation)announcement('Tutor service cannot be reached right now. Other LMS features are unaffected.','offline');
 }
}
async function submit(){
 const prompt=input.value.trim();if(!prompt||busy||prompt.length>2200)return;
 const uid=bridge()?.userId?.();if(!uid){announcement('Please sign in before asking a question.','offline');return}
 const ticket=generation;
 const history=turns.slice(-8);
 input.value='';updateCount();addBubble('user',prompt);
 const reply=addBubble('model','Thinking through your question…',{pending:true});setBusy(true);
 try{
  const data=await bridge().send('/ai/tutor',{method:'POST',body:{prompt,history}});
  if(owner!==uid||ticket!==generation)return;
  const answer=String(data.answer||'').trim();
  if(!answer)throw Error('No answer returned.');
  reply.update(answer+(data.incomplete?'\n\n'+(data.note||'This answer may be incomplete. Ask “continue” to finish.') : ''));
  turns.push({role:'user',text:prompt},{role:'model',text:answer.slice(0,3200)});
  turns=turns.slice(-8);
  announcement('SJN AI Tutor is ready for another question.','ready');
 }catch(e){
  if(owner!==uid||ticket!==generation)return;
  reply.update('I couldn’t answer that just now. '+(e?.message||'Please try again.'));
  announcement('Tutor is temporarily unavailable. Your other LMS features are unaffected.','offline');
 }finally{if(owner===uid&&ticket===generation){setBusy(false);input.focus({preventScroll:true})}}
}
form.addEventListener('submit',e=>{e.preventDefault();void submit()});
input.addEventListener('input',updateCount);
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void submit()}});
root.querySelector('#sjn-ai-new').addEventListener('click',()=>{const uid=owner;reset();owner=uid;announcement('New conversation started. Nothing was saved.','ready');input.focus()});
root.querySelectorAll('[data-sjn-ai-ask]').forEach(el=>el.addEventListener('click',()=>{input.value=el.dataset.sjnAiAsk;updateCount();input.focus({preventScroll:true})}));
if(!SpeechRecognition){
 mic.hidden=true;
}else{
 mic.addEventListener('click',()=>{
  if(busy)return;
  if(recognizing){recognition?.stop();return}
  recognition=new SpeechRecognition();recognition.lang='en-PK';recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onstart=()=>{recognizing=true;mic.classList.add('is-listening');announcement('Listening… your speech will appear in the question box.','ready')};
  recognition.onresult=e=>{const words=e.results?.[0]?.[0]?.transcript||'';input.value=(input.value+' '+words).trim().slice(0,2200);updateCount()};
  recognition.onerror=e=>announcement('Microphone unavailable or permission denied. You can still type your question.','offline');
  recognition.onend=()=>{recognizing=false;mic.classList.remove('is-listening');recognition=null};
  try{recognition.start()}catch(e){announcement('Voice typing is unavailable on this device.','offline')}
 });
}
window.SJNAITutor={enter,reset};
reset();
})();