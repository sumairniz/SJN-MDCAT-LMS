/* Staff-friendly MCQ writing assistance: safe text-only preview, no publication. */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const optionKeys=["a","b","c","d","e"];
  const preview=(prefix,target,includeE)=>{
    const place=$(target);if(!place)return;
    const val=id=>$(prefix+id)?.value||"";
    const statement=val("question");
    place.replaceChildren();
    const title=document.createElement("div");
    title.className="studio-mcq-statement";
    title.textContent=statement||"Write or open a question to see the student-style preview.";
    place.append(title);
    for(const key of optionKeys){
      if(key==="e"&&!includeE)continue;
      const answer=val("option_"+key);
      if(key==="e"&&!answer.trim())continue;
      const line=document.createElement("div");line.className="studio-mcq-choice";
      const mark=document.createElement("strong");mark.textContent=key.toUpperCase()+".";
      const content=document.createElement("span");content.textContent=answer||"—";
      line.append(mark,content);place.append(line);
    }
    const correct=document.createElement("p");
    correct.className="studio-preview-answer";
    const selected=val("correct_option");
    correct.textContent="Proposed correct answer: "+(selected||"Not selected");
    place.append(correct);
    for(const [field,label] of [["explanation","Explanation"],["mnemonic","Mnemonic (optional)"]]){
      const value=val(field);if(!value.trim())continue;
      const line=document.createElement("div");line.className="studio-mcq-note";
      const bold=document.createElement("strong");bold.textContent=label+": ";
      const details=document.createElement("span");details.textContent=value;
      line.append(bold,details);place.append(line);
    }
  };
  const originals=new Map();
  function changes(){
    const el=$("mcq-lib-change-summary");if(!el)return;
    const inputs=[...document.querySelectorAll('#mcq-lib-edit-form input[id^="mcq-lib-edit-"],#mcq-lib-edit-form textarea,#mcq-lib-edit-form select')];
    const changed=inputs.filter(input=>originals.has(input.id)&&input.value!==originals.get(input.id));
    el.textContent=changed.length
      ?changed.length+" field(s) changed: "+changed.map(x=>x.labels?.[0]?.textContent?.trim()||x.id.replace("mcq-lib-edit-","")).join(", ")+". Save Draft to keep your proposed changes."
      :"No fields changed yet. You can edit one option without rewriting the whole MCQ.";
  }
  window.MedNestMCQAssist=Object.freeze({
    captureOriginal(){
      originals.clear();
      for(const x of document.querySelectorAll('#mcq-lib-edit-form input[id^="mcq-lib-edit-"],#mcq-lib-edit-form textarea,#mcq-lib-edit-form select'))originals.set(x.id,x.value);
      changes();preview("mcq-lib-edit-","mcq-lib-live-preview",false);
    },
    hasUnsavedCorrection(){
      const editor=$("mcq-lib-editor");
      if(!editor||editor.classList.contains("is-hidden")||!originals.size)return false;
      for(const [id,value] of originals){if($(id)?.value!==value)return true}
      return false;
    },
    previewExisting(){preview("mcq-lib-edit-","mcq-lib-live-preview",false)},
    previewNew(){preview("studio-","studio-live-preview",true)}
  });
  document.addEventListener("click",event=>{
    const button=event.target.closest(".studio-format-bar button[data-insert]");
    if(!button)return;
    const id=button.parentElement.dataset.editorTarget,target=$(id);
    if(!target||target.readOnly||target.disabled)return;
    const value=button.dataset.insert;
    const a=target.selectionStart??target.value.length,b=target.selectionEnd??a;
    target.setRangeText(value,a,b,"end");
    target.focus();target.dispatchEvent(new Event("input",{bubbles:true}));
  });
  document.addEventListener("input",event=>{
    if(event.target.closest("#mcq-lib-edit-form")){changes();preview("mcq-lib-edit-","mcq-lib-live-preview",false)}
    else if(event.target.closest("#studio-editor-form"))preview("studio-","studio-live-preview",true);
  });
  document.addEventListener("change",event=>{
    if(event.target.closest("#mcq-lib-edit-form")){changes();preview("mcq-lib-edit-","mcq-lib-live-preview",false)}
    else if(event.target.closest("#studio-editor-form"))preview("studio-","studio-live-preview",true);
  });
})();