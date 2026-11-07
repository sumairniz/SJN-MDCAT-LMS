"use strict";
// SJN MedNest Content Studio — local draft editor/import review. No database writes.
(function(){
 const core=window.MedNestContentStudio;
 const $=id=>document.getElementById(id);
 if(!core||!$("content-studio-preview"))return;
 let drafts=[],selected=-1,filter="all",page=0;
 const PAGE_SIZE=40;
 const feedback=(message,error=false)=>{const el=$("studio-feedback");el.textContent=message;el.dataset.error=String(error)};
 const show=(id,on)=>$(id).classList.toggle("is-hidden",!on);
 const cell=(tag,content,cls)=>{
   const el=document.createElement(tag);
   if(cls)el.className=cls;
   if(content!==undefined)el.textContent=String(content);
   return el;
 };
 const fields=["bank","subject","chapter","topic","question","option_a","option_b","option_c","option_d","correct_option","explanation","mnemonic","source","region","year","paper_code"];
 function readEditor(){
   return Object.fromEntries(fields.map(name=>[name,$("studio-"+name).value]));
 }
 function writeEditor(item){
   const data=item||{};
   for(const name of fields)$("studio-"+name).value=data[name]||"";
 }
 function download(filename,contents,type){
   const blob=new Blob([contents],{type});
   const url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
   URL.revokeObjectURL(url);
 }
 function summary(){
   const inspected=core.inspectDrafts(drafts);
   $("studio-total").textContent=String(inspected.length);
   $("studio-ready").textContent=String(inspected.filter(x=>x.status==="ready").length);
   $("studio-review").textContent=String(inspected.filter(x=>x.status==="review").length);
   $("studio-invalid").textContent=String(inspected.filter(x=>x.status==="invalid").length);
   $("studio-export").disabled=!inspected.length;
   return inspected;
 }
 function render(){
   const inspected=summary();
   const shown=inspected.filter(x=>filter==="all"||x.status===filter);
   const pages=Math.max(1,Math.ceil(shown.length/PAGE_SIZE));page=Math.min(page,pages-1);
   $("studio-range").textContent=shown.length?
     "Showing "+(page*PAGE_SIZE+1)+"–"+Math.min(shown.length,(page+1)*PAGE_SIZE)+" of "+shown.length:
     "No matching draft questions";
   $("studio-page").textContent="Page "+(page+1)+" of "+pages;
   $("studio-prev").disabled=page===0;$("studio-next").disabled=page>=pages-1;
   const tbody=$("studio-draft-list");tbody.replaceChildren();
   if(!shown.length){
     const tr=document.createElement("tr"),td=cell("td","No drafts yet. Add a question or import a CSV template.");
     td.colSpan=5;tr.append(td);tbody.append(tr);return;
   }
   for(const item of shown.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)){
     const tr=document.createElement("tr");
     const status=cell("span",item.status.toUpperCase(),"studio-status studio-status--"+item.status);
     const td1=document.createElement("td");td1.append(status);
     const td2=cell("td",item.entry.bank||"—");
     const td3=cell("td",(item.entry.subject||"—")+" / "+(item.entry.chapter||"—"));
     const td4=cell("td",item.entry.question||"(missing statement)","studio-question-cell");
     const td5=document.createElement("td");
     const button=cell("button","Review / Edit","studio-edit");button.type="button";
     button.addEventListener("click",()=>openEditor(item.line));
     td5.append(button);tr.append(td1,td2,td3,td4,td5);
     tbody.append(tr);
     if(item.errors.length||item.warnings.length){
       const detail=document.createElement("tr"),td=document.createElement("td");
       td.colSpan=5;td.className="studio-feedback-cell";
       td.textContent="Row "+item.line+": "+[...item.errors.map(x=>"Error: "+x),...item.warnings.map(x=>"Review: "+x)].join(" | ");
       detail.append(td);tbody.append(detail);
     }
   }
 }
 function openEditor(line){
   const index=drafts.findIndex(x=>x.line===line);
   if(index<0)return;
   selected=index;writeEditor(drafts[index].entry);
   $("studio-editor-heading").textContent="Review draft row "+line;
   $("studio-save").textContent="Update Draft";
   show("studio-editor",true);
   $("studio-editor").scrollIntoView({behavior:"smooth",block:"nearest"});
 }
 $("studio-template").addEventListener("click",()=>download(
   "sjn-mednest-mcq-import-template.csv",core.csvTemplate(),"text/csv;charset=utf-8"
 ));
 $("studio-file").addEventListener("change",async event=>{
   const file=event.target.files?.[0];
   if(!file)return;
   try{
     if(!/\.csv$/i.test(file.name))throw Error("This batch supports CSV files. XLSX import is not enabled yet.");
     if(file.size>core.MAX_FILE_CHARS*4)throw Error("File is too large for a draft preview.");
     const text=await file.text();
     const entries=core.importCSV(text);
     if(!entries.length)throw Error("This CSV has no question rows.");
     if(entries.length+drafts.length>core.MAX_ROWS)throw Error("Draft preview can hold up to 10,000 rows.");
     const nextLine=drafts.length?Math.max(...drafts.map(x=>x.line))+1:1;
     drafts.push(...entries.map((x,i)=>({line:nextLine+i,entry:x.entry})));
     page=0;filter="all";$("studio-filter").value="all";render();
     feedback("Imported "+entries.length+" rows into this browser-only draft. Nothing was published or saved to the LMS.");
   }catch(e){feedback(e.message,true)}
   finally{event.target.value=""}
 });
 $("studio-new").addEventListener("click",()=>{
   selected=-1;writeEditor({bank:"SJN Question Bank",subject:"Biology"});
   $("studio-editor-heading").textContent="Create a new draft MCQ";
   $("studio-save").textContent="Add to Draft";
   show("studio-editor",true);
   $("studio-question").focus();
 });
 $("studio-cancel").addEventListener("click",()=>{selected=-1;show("studio-editor",false)});
 $("studio-editor-form").addEventListener("submit",event=>{
   event.preventDefault();
   const entry=readEditor(),result=core.validate(entry);
   if(result.errors.length){
     feedback("Draft validation: "+result.errors.join(" "),true);
     return;
   }
   if(selected>=0)drafts[selected].entry=entry;
   else {
     const nextLine=drafts.length?Math.max(...drafts.map(x=>x.line))+1:1;
     drafts.push({line:nextLine,entry});
   }
   selected=-1;show("studio-editor",false);render();
   feedback("Draft updated in this browser session. "+(result.warnings.length?result.warnings.join(" "):"Ready for academic review.")+" Nothing published.");
 });
 $("studio-filter").addEventListener("change",event=>{filter=event.target.value;page=0;render()});
 $("studio-prev").addEventListener("click",()=>{page=Math.max(0,page-1);render()});
 $("studio-next").addEventListener("click",()=>{page++;render()});
 $("studio-export").addEventListener("click",()=>{
   try{
     const result=core.exportDrafts(drafts);
     download("sjn-mednest-unpublished-mcq-drafts.json",JSON.stringify(result,null,2),"application/json");
     feedback("Unpublished draft review file downloaded. No data was sent to Supabase or published.");
   }catch(e){feedback(e.message,true)}
 });
 $("studio-clear").addEventListener("click",()=>{
   if(!drafts.length)return;
   if(!window.confirm("Clear all unpublished drafts from this browser session? Export first if you want to keep them."))return;
   drafts=[];selected=-1;page=0;show("studio-editor",false);render();
   feedback("Browser draft cleared. Existing LMS MCQs were not affected.");
 });
 $("studio-editor").classList.add("is-hidden");
 render();
})();
