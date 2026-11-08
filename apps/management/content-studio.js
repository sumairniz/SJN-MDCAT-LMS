"use strict";
// SJN MedNest Content Studio — local draft editor/import review. No database writes.
(function(){
 const core=window.MedNestContentStudio;
 const $=id=>document.getElementById(id);
 if(!core||!$("content-studio-preview"))return;
 let drafts=[],selected=-1,filter="all",page=0;
 let savedBatchId=null,clientBatchKey=null,savedStatus="unsaved",dirty=false,advanceOnSave=false;
 let studioView="drafts",inspectMode=false,focusLine=null,focusPage=0,focusQuery="",editorSnapshot=null,saveInFlight=false;
 const taxonomy=window.MedNestTaxonomy;
 let catalog=null,taxonomyReviewLine=null;
 const canon=s=>String(s||"").trim().replace(/\s+/g," ").toLocaleLowerCase("en");
 const PAGE_SIZE=40;
 function routeControls(){
   const state=savedStatus;
   $("studio-batch-name").readOnly=!!savedBatchId;
   const title=state==="unsaved"?"New · Unsaved":
     state==="draft"?"Working Draft":state==="pending_review"?"Pending Academic Review":
     state==="needs_changes"?"Changes Requested":state==="approved_for_release"?"Approved for Release":state;
   $("studio-batch-state").textContent=title+(dirty?" · Unsaved Changes":"");
   const canRoute=!!savedBatchId&&!dirty&&(state==="draft"||state==="needs_changes");
   $("studio-review-submit").disabled=!canRoute;
   $("studio-direct-prepare").disabled=!canRoute;
   $("studio-save-batch").disabled=state==="pending_review"||state==="approved_for_release";
   show("studio-withdraw-review",state==="pending_review"&&!!savedBatchId);
   $("studio-route-status").textContent=state==="approved_for_release"
    ?"Approved for release — NOT published to students. A separate secure publishing service is still required."
    :state==="pending_review"
     ?"Awaiting independent academic review. The author cannot approve their own batch. Publication remains disabled."
     :dirty?"Unsaved changes. Save Draft before requesting review or release preparation."
     :"Academic review is optional for authorized staff. Both routes require technical validation; neither publishes to the Student LMS.";
 }
 function modified(){dirty=true;routeControls()}

 const feedback=(message,error=false)=>{const el=$("studio-feedback");el.textContent=message;el.dataset.error=String(error)};
 const show=(id,on)=>$(id).classList.toggle("is-hidden",!on);
 const cell=(tag,content,cls)=>{
   const el=document.createElement(tag);
   if(cls)el.className=cls;
   if(content!==undefined)el.textContent=String(content);
   return el;
 };
 const fields=["bank","subject","chapter","topic","question","option_a","option_b","option_c","option_d","option_e","correct_option","explanation","mnemonic","source","region","year","paper_code"];

 const FOCUS_PAGE_SIZE=24;
 const locked=()=>savedStatus==="pending_review"||savedStatus==="approved_for_release";
 function formChanged(){
   if($("studio-editor").classList.contains("is-hidden")||editorSnapshot===null)return false;
   return JSON.stringify(readEditor())!==editorSnapshot;
 }
 function askAbandonForm(){
   if(studioView==="browse"&&window.MedNestMCQAssist?.hasUnsavedCorrection?.())
     return window.confirm("You have unsaved changes in the existing MCQ editor. Leave this view without saving them?");
   return !formChanged()||window.confirm("This question has unsaved edits. Leave it without saving?");
 }
 function setStudioView(view){
   if(!["drafts","browse","import","focus"].includes(view))throw Error("Invalid workspace view");
   studioView=view;
   $("content-studio-preview").dataset.studioView=view;
   for(const key of ["drafts","browse","import"]){
     const button=$("studio-nav-"+key);
     button.classList.toggle("is-current",key===view);
     button.setAttribute("aria-pressed",String(key===view));
   }
   show("studio-focus-workspace",view==="focus");
   if(view==="focus")renderFocus();
 }
 function focusStateMessage(msg,error=false){
   $("studio-focus-save-status").textContent=msg;
   $("studio-focus-feedback").textContent=msg;
   $("studio-focus-feedback").dataset.error=String(error);
 }
 function focusReadOnlyQuestion(item){
   if(!item)return;
   focusLine=item.line;
   show("studio-focus-empty",false);
   show("studio-editor",false);
   show("studio-focus-readonly",true);
   const f=item.entry,body=$("studio-focus-inspect-body");body.replaceChildren();
   $("studio-focus-inspect-heading").textContent="Question "+item.line+" · Read-only inspection";
   const statement=cell("div",f.question||"No question statement","studio-mcq-statement");body.append(statement);
   for(const key of ["a","b","c","d","e"]){
     if(key==="e"&&!f.option_e?.trim())continue;
     const choice=document.createElement("div");choice.className="studio-mcq-choice";
     choice.append(cell("strong",key.toUpperCase()+"."),cell("span",f["option_"+key]||"—"));
     body.append(choice);
   }
   body.append(cell("p","Proposed answer: "+(f.correct_option||"Not selected"),"studio-preview-answer"));
   for(const [field,label] of [["explanation","Explanation"],["mnemonic","Mnemonic"]]){
     if(f[field]?.trim())body.append(cell("div",label+": "+f[field],"studio-mcq-note"));
   }
   body.append(cell("p","Classification: "+[f.subject||"—",f.chapter||"—",f.topic||"—"].join(" → "),"tiny-text"));
   if(f.source?.trim())body.append(cell("p","Original source: "+f.source,"tiny-text"));
 }
 function renderFocus(){
   const active=studioView==="focus";
   if(!active)return;
   const name=$("studio-batch-name").value.trim()||"New MCQ Draft";
   $("studio-focus-title").textContent=name;
   $("studio-focus-subtitle").textContent=
     drafts.length+" question"+(drafts.length===1?"":"s")+" · "+(savedBatchId?"Saved batch":"New working set");
   $("studio-focus-status").textContent=savedStatus.replaceAll("_"," ")+(dirty?" · unsaved edits":"");
   $("studio-focus-count").textContent=String(drafts.length);
   const issues=core.inspectDrafts(drafts);
   const invalid=issues.filter(x=>x.errors.length).length;
   $("studio-focus-validation").textContent=invalid?invalid+" require correction":"Question list";
   const term=focusQuery.trim().toLocaleLowerCase("en");
   const matching=drafts.filter(x=>!term||[String(x.line),x.entry.question,x.entry.chapter,x.entry.topic]
       .some(y=>String(y||"").toLocaleLowerCase("en").includes(term)));
   const pages=Math.max(1,Math.ceil(matching.length/FOCUS_PAGE_SIZE));
   focusPage=Math.min(focusPage,pages-1);
   const chunk=matching.slice(focusPage*FOCUS_PAGE_SIZE,(focusPage+1)*FOCUS_PAGE_SIZE);
   $("studio-focus-page").textContent=matching.length?
     (focusPage+1)+" / "+pages+" · "+matching.length+" found":"No matching questions";
   $("studio-focus-prev").disabled=focusPage===0;
   $("studio-focus-next").disabled=focusPage>=pages-1;
   const list=$("studio-focus-questions");list.replaceChildren();
   if(!matching.length)list.append(cell("p",drafts.length?"No questions match your search.":"Add your first question to this draft.","tiny-text"));
   for(const item of chunk){
     const button=cell("button",undefined,"studio-focus-question"+(focusLine===item.line?" is-active":""));
     button.type="button";button.setAttribute("role","listitem");
     button.setAttribute("aria-current",String(focusLine===item.line));
     const heading=cell("span","Q"+item.line+" · "+(item.entry.topic||item.entry.chapter||item.entry.subject||"Unclassified"),"studio-focus-question-head");
     const question=cell("span",(item.entry.question||"Empty question").slice(0,94),"studio-focus-question-text");
     button.append(heading,question);
     button.addEventListener("click",()=>openFocusedLine(item.line));
     list.append(button);
   }
   const readOnly=inspectMode||locked();
   $("studio-focus-add").disabled=readOnly||saveInFlight||drafts.length>=3000;
   $("studio-focus-save").disabled=readOnly||saveInFlight;
   $("studio-focus-save").disabled=readOnly||saveInFlight;
   $("studio-focus-submit-review").disabled=readOnly||dirty||!savedBatchId;
   $("studio-focus-direct-prepare").disabled=readOnly||dirty||!savedBatchId;
   show("studio-focus-withdraw",savedStatus==="pending_review"&&!!savedBatchId);
   $("studio-focus-review-options").classList.toggle("is-hidden",inspectMode);
   if(readOnly&&focusLine!=null){
     const row=drafts.find(x=>x.line===focusLine);
     if(row)focusReadOnlyQuestion(row);
   }
   if(!readOnly&&!drafts.length&&$("studio-editor").classList.contains("is-hidden")){
     show("studio-focus-empty",true);show("studio-focus-readonly",false);
   }
 }
 function openFocusedLine(line){
   if(saveInFlight||!askAbandonForm())return;
   const item=drafts.find(x=>x.line===line);if(!item)return;
   focusLine=line;setStudioView("focus");
   if(inspectMode||locked())focusReadOnlyQuestion(item);
   else openEditor(line);
   renderFocus();
 }
 function exitFocus(){
   if(saveInFlight||!askAbandonForm())return;
   editorSnapshot=null;inspectMode=false;focusLine=null;
   show("studio-editor",false);show("studio-focus-readonly",false);
   setStudioView("drafts");
   window.scrollTo({top:0,behavior:"instant"});
   $("studio-open-workspace").focus();
 }
 function openWorkspace({inspect=false,line=null}={}){
   if(saveInFlight||!askAbandonForm())return;
   inspectMode=Boolean(inspect);editorSnapshot=null;
   show("studio-editor",false);show("studio-focus-readonly",false);
   show("studio-focus-empty",true);
   focusLine=null;
   setStudioView("focus");
   if(drafts.length){
     const selectedLine=line??drafts[0].line;
     openFocusedLine(selectedLine);
   }else renderFocus();
   window.scrollTo({top:0,behavior:"instant"});
 }
 function focusFormSnapshot(){editorSnapshot=JSON.stringify(readEditor())}
 $("studio-focus-back").addEventListener("click",exitFocus);
 $("studio-open-workspace").addEventListener("click",()=>openWorkspace());
 $("studio-focus-add").addEventListener("click",()=>$("studio-new").click());
 $("studio-focus-save").addEventListener("click",()=>{
   if(formChanged()){focusStateMessage("Save the open question first (Save Question / Save & Next).",true);return}
   $("studio-save-batch").click();
 });
 $("studio-focus-upload").addEventListener("click",()=>{
   if(!askAbandonForm())return;
   setStudioView("import");window.scrollTo({top:0,behavior:"instant"});
 });
 $("studio-focus-submit-review").addEventListener("click",()=>$("studio-review-submit").click());
 $("studio-focus-direct-prepare").addEventListener("click",()=>$("studio-direct-prepare").click());
 $("studio-focus-withdraw").addEventListener("click",()=>$("studio-withdraw-review").click());
 $("studio-focus-search").addEventListener("input",event=>{
   focusQuery=event.target.value;focusPage=0;renderFocus();
 });
 $("studio-focus-prev").addEventListener("click",()=>{focusPage--;renderFocus()});
 $("studio-focus-next").addEventListener("click",()=>{focusPage++;renderFocus()});
 for(const key of ["drafts","browse","import"]){
   $("studio-nav-"+key).addEventListener("click",()=>{
     if(saveInFlight||!askAbandonForm())return;
     if(studioView==="focus"){inspectMode=false;focusLine=null;show("studio-editor",false)}
     setStudioView(key);
   });
 }
 window.addEventListener("beforeunload",event=>{
   if(dirty||formChanged()){event.preventDefault();event.returnValue=""}
 });
 function readEditor(){
   return Object.fromEntries(fields.map(name=>[name,$("studio-"+name).value]));
 }
 function writeEditor(item){
   const data=item||{};
   for(const name of fields)$("studio-"+name).value=data[name]||"";
  window.MedNestMCQAssist?.previewNew();
 }
 function download(filename,contents,type){
   const blob=new Blob([contents],{type});
   const url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
   URL.revokeObjectURL(url);
 }
 function summary(){
   const inspected=core.inspectDrafts(drafts).map(item=>{
     if(item.errors.length)return item;
     if(!catalog){
       item.warnings.push("Approved Academy syllabus is not ready; chapter/topic need confirmation.");
       item.status="review";return item;
     }
     const match=taxonomy.resolve(item.entry,catalog);
     item.taxonomy=match;
     if(match.status!=="matched"){
       item.warnings.push("Chapter/topic requires matching against your approved Academy syllabus.");
       item.status="review";
     }
     return item;
   });
   $("studio-total").textContent=String(inspected.length);
   $("studio-ready").textContent=String(inspected.filter(x=>x.status==="ready").length);
   $("studio-review").textContent=String(inspected.filter(x=>x.status==="review").length);
   $("studio-invalid").textContent=String(inspected.filter(x=>x.status==="invalid").length);
   $("studio-export").disabled=!inspected.length;
   routeControls();
   if(studioView==="focus")renderFocus();
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
     const tr=document.createElement("tr"),td=cell("td","No drafts yet. Add an MCQ or import a CSV/XLSX file.");
     td.colSpan=5;tr.append(td);tbody.append(tr);return;
   }
   for(const item of shown.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)){
     const tr=document.createElement("tr");
     const status=cell("span",item.status==="review"?"CHECK NEEDED":item.status.toUpperCase(),"studio-status studio-status--"+item.status);
     const td1=document.createElement("td");td1.append(status);
     const td2=cell("td",item.entry.bank||"—");
     const td3=cell("td",[item.entry.subject||"Unclassified",item.entry.chapter||"No chapter",item.entry.topic||"Unmapped topic"].join(" → "));
     const td4=cell("td",item.entry.question||"(missing statement)","studio-question-cell");
     const td5=document.createElement("td");
     const button=cell("button",locked()?"Inspect Question":"Edit Question","studio-edit");button.type="button";
     button.addEventListener("click",()=>{
       if(studioView!=="focus")openWorkspace({inspect:locked(),line:item.line});
       else openFocusedLine(item.line);
     });
     td5.append(button);
     if(item.taxonomy?.status==="blocked"){
       const choose=cell("button","Match Syllabus Topic","studio-edit");choose.type="button";
       choose.addEventListener("click",()=>openTaxonomy(item.line));
       td5.append(choose);
     }
     tr.append(td1,td2,td3,td4,td5);
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
   if(locked()||inspectMode){const row=drafts.find(x=>x.line===line);if(row)focusReadOnlyQuestion(row);return;}
   const index=drafts.findIndex(x=>x.line===line);
   if(index<0)return;
   focusLine=line;selected=index;writeEditor(drafts[index].entry);
   $("studio-editor-heading").textContent="Edit Question "+line;
   $("studio-save").textContent="Save Question";
   show("studio-focus-readonly",false);show("studio-focus-empty",false);
   show("studio-editor",true);focusFormSnapshot();setStudioView("focus");
   window.MedNestMCQAssist?.previewNew();
   $("studio-editor").scrollIntoView({behavior:"smooth",block:"nearest"});
 }
 $("studio-template").addEventListener("click",()=>download(
   "sjn-mednest-mcq-import-template.csv",core.csvTemplate($("studio-template-bank").value),"text/csv;charset=utf-8"
 ));
 $("studio-template-xlsx").addEventListener("click",()=>{
   try{
     if(!window.MedNestXLSXTemplate)throw Error("Excel template generator unavailable.");
     const bank=$("studio-template-bank").value;
     const rows=core.parseCSV(core.csvTemplate(bank));
     const blob=window.MedNestXLSXTemplate.create(rows);
     const url=URL.createObjectURL(blob),link=document.createElement("a");
     link.href=url;link.download="sjn-mednest-"+(bank==="Past Papers Question Bank"?"past-paper":"question-bank")+"-mcq-template.xlsx";
     document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
     feedback("Excel template downloaded. One row per MCQ; Option E is optional. Save as .xlsx and upload to preview.");
   }catch(e){feedback(e.message,true)}
 });
 $("studio-file").addEventListener("change",async event=>{
   const file=event.target.files?.[0];
   if(!file)return;
   try{
     if(!/\.(csv|xlsx)$/i.test(file.name))throw Error("Choose a CSV or XLSX file.");
     if(file.size>20_000_000)throw Error("File exceeds the safe 20 MB limit.");
     let entries;
     if(/\.xlsx$/i.test(file.name)){
       if(!window.MedNestXLSX)throw Error("Excel reader is not loaded.");
       const workbook=await window.MedNestXLSX.readXLSX(await file.arrayBuffer());
       entries=core.importCSV(window.MedNestXLSX.toCSV(workbook.rows));
     }else entries=core.importCSV(await file.text());
     if(!entries.length)throw Error("This CSV has no question rows.");
     if(entries.length+drafts.length>3000)throw Error("One protected draft supports up to 3,000 questions. Start another draft for additional rows.");
     if(locked())throw Error("Submitted drafts are locked. Start another draft.");
     const nextLine=drafts.length?Math.max(...drafts.map(x=>x.line))+1:1;
     drafts.push(...entries.map((x,i)=>({line:nextLine+i,entry:canonicalizeExact(x.entry)})));
     modified();page=0;filter="all";$("studio-filter").value="all";render();
     focusLine=null;inspectMode=false;setStudioView("focus");
     feedback("Imported "+entries.length+" questions. Save Draft to retain them securely. Nothing published.");
     focusStateMessage("Imported "+entries.length+" questions. Click Save Draft to store this batch.");
   }catch(e){feedback(e.message,true)}
   finally{event.target.value=""}
 });
 function canonicalizeExact(entry){
   if(!catalog)return entry;
   const result=taxonomy.resolve(entry,catalog);
   if(result.status!=="matched")return entry;
   return {...entry,subject:result.subject.canonical,
     chapter:result.chapter.canonical,topic:result.topic.canonical};
 }
 function selector(id,options,placeholder){
   const el=$(id);el.replaceChildren(new Option(placeholder,""));
   for(const item of options){const label=typeof item==="string"?item:item.label;el.append(new Option(label,label))}
 }
 function updateTopics(){
   if(!catalog)return;
   const item=drafts.find(x=>x.line===taxonomyReviewLine);if(!item)return;
   const choices=catalog.topics(item.entry.subject,$("studio-taxonomy-chapter").value);
   selector("studio-taxonomy-topic",choices,"Choose existing topic");
   const matched=choices.find(x=>canon(x.label)===canon(item.entry.topic));
   if(matched)$("studio-taxonomy-topic").value=matched.label;
 }
 function openTaxonomy(line){
   if(!catalog){feedback("Master syllabus unavailable. Add or approve syllabus entries in Syllabus & Taxonomy.",true);return}
   const item=drafts.find(x=>x.line===line);if(!item)return;
   const subject=catalog.subjects().find(x=>canon(x)===canon(item.entry.subject));
   if(!subject){feedback("Edit this draft and select an approved subject first.",true);return}
   taxonomyReviewLine=line;
   const review=taxonomy.resolve(item.entry,catalog);
   const hints=[
     ...(review.chapter?.candidates||[]).slice(0,3).map(x=>"Chapter suggestion: "+x.label),
     ...(review.topic?.candidates||[]).slice(0,3).map(x=>"Topic suggestion: "+x.label)
   ];
   $("studio-taxonomy-original").textContent="Imported: "+item.entry.subject+" → "+
     item.entry.chapter+" → "+item.entry.topic+(hints.length?" | "+hints.join("; "):"");
   const chapters=catalog.chapters(subject);
   selector("studio-taxonomy-chapter",chapters,"Choose existing chapter");
   const match=chapters.find(x=>canon(x.label)===canon(item.entry.chapter));
   if(match)$("studio-taxonomy-chapter").value=match.label;
   updateTopics();
   show("studio-taxonomy-editor",true);
   $("studio-taxonomy-editor").scrollIntoView({behavior:"smooth",block:"nearest"});
 }
 $("studio-taxonomy-chapter").addEventListener("change",updateTopics);
 $("studio-taxonomy-apply").addEventListener("click",()=>{
   const index=drafts.findIndex(x=>x.line===taxonomyReviewLine);
   if(index<0||!catalog)return;
   const entry=drafts[index].entry;
   const chapter=$("studio-taxonomy-chapter").value,topic=$("studio-taxonomy-topic").value;
   if(!catalog.chapters(entry.subject).some(x=>x.label===chapter)||
      !catalog.topics(entry.subject,chapter).some(x=>x.label===topic)){
     feedback("Select an existing chapter and topic. New topic names require separate approval.",true);
     return;
   }
   drafts[index].entry={...entry,chapter,topic};
   modified();taxonomyReviewLine=null;show("studio-taxonomy-editor",false);render();
   feedback("Approved Academy syllabus label applied to unpublished draft; student MCQs unchanged.");
 });
 $("studio-taxonomy-cancel").addEventListener("click",()=>{
   taxonomyReviewLine=null;show("studio-taxonomy-editor",false);
 });
 let renameProposals=[];
 const renameStatus=(text,error=false)=>{
   const node=$("studio-rename-status");node.textContent=text;node.dataset.error=String(error);
 };
 function renderRenamePlan(){
   const body=$("studio-rename-list");body.replaceChildren();
   $("studio-rename-export").disabled=!renameProposals.length;
   if(!renameProposals.length){
     const row=document.createElement("tr"),td=cell("td","No correction proposals imported.");
     td.colSpan=5;row.append(td);body.append(row);return;
   }
   for(const x of renameProposals.slice(0,1000)){
     const row=document.createElement("tr");
     for(const value of [x.status.toUpperCase(),x.subject+" / "+x.chapter,x.original,x.proposed,
       "Used by "+x.usage_count+" MCQs. "+[...x.problems,...x.warnings].join(" ")])
       row.append(cell("td",value));
     body.append(row);
   }
 }
 $("studio-rename-template").addEventListener("click",()=>download(
   "sjn-mednest-topic-corrections-template.csv",
   taxonomy.renameCSVTemplate(),"text/csv;charset=utf-8"
 ));
 $("studio-rename-file").addEventListener("change",async event=>{
   const file=event.target.files?.[0];if(!file)return;
   try{
     if(!catalog)throw Error("Approved Academy syllabus must load before reviewing corrections.");
     if(!/\.csv$/i.test(file.name)||file.size>400_000)
       throw Error("Choose a corrections CSV under 400 KB.");
     const plan=taxonomy.reviewRenamePlan(await file.text(),catalog,core.parseCSV);
     renameProposals=plan;renderRenamePlan();
     const invalid=plan.filter(x=>x.problems.length).length;
     renameStatus("Reviewed "+plan.length+" correction proposals; "+invalid+
       " invalid. This is a review-only plan: no LMS topic was renamed.");
   }catch(e){renameStatus(e.message,true)}
   finally{event.target.value=""}
 });
 $("studio-rename-export").addEventListener("click",()=>{
   const out=taxonomy.exportRenamePlan(renameProposals);
   download("sjn-mednest-proposed-topic-corrections.json",
     JSON.stringify(out,null,2),"application/json");
   renameStatus("Correction proposal exported for independent approval. No database changes.");
 });
 function loadTaxonomy(){
   const entries=window.MedNestSyllabus?.getActiveEntries?.()||[];
   if(!entries.length){
     catalog=null;
     $("studio-taxonomy-source").textContent=
       "No approved Academy syllabus topics yet. Open Syllabus & Taxonomy to upload and approve the master syllabus. Existing MCQ labels are provisional and will NOT be used as the reference.";
     render();return;
   }
   catalog=taxonomy.catalogue(entries);
   drafts=drafts.map(row=>({...row,entry:canonicalizeExact(row.entry)}));
   $("studio-taxonomy-source").textContent=
     "Academy-approved master syllabus: "+entries.length+
     " active subject/chapter/topic paths. Case and spacing differences match automatically. Unapproved names require review.";
   render();
 }
 window.addEventListener("mednest:syllabus-updated",loadTaxonomy);
 loadTaxonomy();
 $("studio-new").addEventListener("click",()=>{
   if(saveInFlight||!askAbandonForm())return;
   if(locked()){
     feedback("This draft is locked after submission. Start Another Draft or withdraw a pending request first.",true);return;
   }
   const last=drafts[drafts.length-1]?.entry||{};
   focusLine=null;inspectMode=false;
   selected=-1;writeEditor({bank:last.bank||"SJN Question Bank",subject:last.subject||"Biology",
     chapter:last.chapter||"",topic:last.topic||"",source:last.source||"",
     region:last.region||"",year:last.year||"",paper_code:last.paper_code||""});
   $("studio-editor-heading").textContent="Add question "+(drafts.length+1)+" to this draft";
   $("studio-save").textContent="Save Question";
   show("studio-focus-readonly",false);show("studio-focus-empty",false);
   show("studio-editor",true);focusFormSnapshot();setStudioView("focus");
   window.MedNestMCQAssist?.previewNew();
   $("studio-question").focus();
 });
 $("studio-cancel").addEventListener("click",()=>{
   if(saveInFlight||!askAbandonForm())return;
   selected=-1;advanceOnSave=false;editorSnapshot=null;
   show("studio-editor",false);show("studio-focus-empty",true);renderFocus();
 });
 $("studio-save-next").addEventListener("click",()=>{
   advanceOnSave=true;
   $("studio-editor-form").requestSubmit();
 });
 $("studio-new-set").addEventListener("click",()=>{
   if(saveInFlight||!askAbandonForm())return;
   if(dirty&&drafts.length&&!window.confirm("This working draft has unsaved changes. Start a new draft without saving them?"))return;
   drafts=[];selected=-1;page=0;filter="all";savedBatchId=null;clientBatchKey=null;
   savedStatus="unsaved";dirty=false;editorSnapshot=null;focusLine=null;inspectMode=false;
   $("studio-batch-name").readOnly=false;
   focusStateMessage("New working draft. Add your first question.");
   $("studio-filter").value="all";$("studio-batch-name").value="New MCQ Draft";
   $("studio-saved-batches").value="";show("studio-editor",false);setStudioView("drafts");render();
   storageStatus("New blank draft ready. Add questions manually or import an Excel file.");
 });

 async function saveDraftItems(items,{updateAll=false,onProgress}={}){
   if(saveInFlight)throw Error("A save is already in progress.");
   if(locked())throw Error("Submitted and approved batches are read-only.");
   if(!items.length||items.length>3000)throw Error("Draft must contain 1–3,000 questions.");
   const nameControl=$("studio-batch-name");
   if(!savedBatchId&&["New MCQ Draft","Unpublished MCQ Review Batch"].includes(nameControl.value.trim())){
     const first=items[0]?.entry||{},subject=first.subject||"Academy",chapter=first.chapter||"Questions";
     const stamp=new Date().toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
     nameControl.value=(subject+" — "+chapter+" · "+stamp).slice(0,120);
   }
   const title=nameControl.value.trim();
   if(!title)throw Error("Please give your draft a name before saving questions.");
   if(savedBatchId&&!updateAll&&items.length!==1)
     throw Error("Save one changed question or the whole batch.");
   if(!clientBatchKey)clientBatchKey=window.crypto.randomUUID();
   saveInFlight=true;
   busy(true);
   for(const id of ["studio-save","studio-save-next","studio-cancel","studio-focus-save","studio-focus-add"])
     $(id).disabled=true;
   try{
     const result=await storage().save({
       batchId:savedBatchId,clientKey:clientBatchKey,title,items,
       onProgress:onProgress||((done,total)=>focusStateMessage("Securely saving "+done+" of "+total+" question"+(total===1?"":"s")+"…"))
     });
     savedBatchId=result.batchId;clientBatchKey=result.clientKey;
     savedStatus="draft";dirty=false;
     $("studio-batch-name").readOnly=true;
     focusStateMessage("Saved securely · "+new Date().toLocaleTimeString()+". Nothing published.");
     routeControls();
     return result;
   }finally{
     saveInFlight=false;
     busy(false);
     for(const id of ["studio-save","studio-save-next","studio-cancel","studio-focus-add"])
       $(id).disabled=false;
     routeControls();renderFocus();
   }
 }
 $("studio-editor-form").addEventListener("submit",async event=>{
   event.preventDefault();
   if(saveInFlight||locked()||inspectMode)return;
   const entry=canonicalizeExact(readEditor()),result=core.validate(entry);
   if(result.errors.length){
     advanceOnSave=false;
     feedback("Please correct: "+result.errors.join(" "),true);
     focusStateMessage("Please correct: "+result.errors.join(" "),true);
     return;
   }
   const next=advanceOnSave;advanceOnSave=false;
   const index=selected;
   const position=index>=0?drafts[index].line:
     (drafts.length?Math.max(...drafts.map(x=>x.line))+1:1);
   if(position>3000){
     focusStateMessage("One protected draft supports 3,000 questions. Create another draft.",true);return;
   }
   const candidate={line:position,entry};
   const updatedRows=index>=0?drafts.map((x,i)=>i===index?candidate:x):[...drafts,candidate];
   // When previous imported/edited rows were not yet saved, persist all of
   // them on the first question save; otherwise send only this one row.
   const items=dirty||!savedBatchId?updatedRows:[candidate];
   try{
     await saveDraftItems(items,{updateAll:items.length>1});
     drafts=updatedRows;selected=-1;editorSnapshot=null;focusLine=position;
     show("studio-editor",false);show("studio-focus-readonly",false);
     show("studio-focus-empty",!next);
     render();
     try{await reloadBatchList();$("studio-saved-batches").value=savedBatchId}
     catch(e){storageStatus("Question saved. Refresh the draft list to see the latest label.");}
     focusStateMessage("Question "+position+" saved to your protected draft.");
     feedback("Question "+position+" saved securely to Management. "+(result.warnings.length?"Checks: "+result.warnings.join(" "):"")+" Nothing published.");
     if(next)$("studio-new").click();
   }catch(e){
     dirty=true;editorSnapshot=JSON.stringify({failedSave:true});routeControls(); // Keep the unsaved form protected on exit.
     focusStateMessage("Save failed. Your question is still in the editor. Try again: "+e.message,true);
     feedback("Save failed; question has not been confirmed in protected storage. "+e.message,true);
   }
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
   drafts=[];selected=-1;page=0;savedBatchId=null;clientBatchKey=null;savedStatus="unsaved";dirty=false;
   $("studio-batch-name").readOnly=false;
   $("studio-saved-batches").value="";show("studio-editor",false);render();
   feedback("Browser draft cleared. Existing LMS MCQs were not affected.");
 });
 const storageStatus=(message,error=false)=>{
   const el=$("studio-storage-status");el.textContent=message;el.dataset.error=String(error);
 };
 const storage=()=>{
   if(!window.MedNestStudioStorage)throw Error("Protected draft storage is not ready. Refresh the Management Panel.");
   return window.MedNestStudioStorage;
 };
 const busy=(active)=>{
   for(const id of ["studio-save-batch","studio-refresh-batches","studio-load-batch"])$(id).disabled=active;
 };
 async function reloadBatchList(){
   const response=await storage().list();
   const list=$("studio-saved-batches");const previous=list.value;
   list.replaceChildren(new Option("Select a saved draft batch",""));
   for(const batch of response.batches||[]){
     const label=batch.title+" · "+batch.status.replaceAll("_"," ")+" · "+new Date(batch.updated_at).toLocaleString();
     list.append(new Option(label,batch.id));
   }
   if([...list.options].some(x=>x.value===previous))list.value=previous;
 }

 async function showNewBatchReviewStatuses(){
   const tbody=$("review-new-batch-list"),status=$("review-new-batch-status");
   tbody.replaceChildren();
   try{
     const response=await storage().list();
     const batches=response.batches||[];
     if(!batches.length){
       const tr=document.createElement("tr"),td=cell("td","No new-question draft batches saved yet.");
       td.colSpan=4;tr.append(td);tbody.append(tr);status.textContent="Create questions and Save Draft in Question Content Studio first.";return;
     }
     for(const batch of batches){
       const tr=document.createElement("tr");
       const name=cell("td",batch.title),state=cell("td",batch.status.replaceAll("_"," ")),
         when=cell("td",new Date(batch.updated_at).toLocaleString()),action=document.createElement("td");
       const open=cell("button","Inspect Questions","studio-edit");open.type="button";
       open.addEventListener("click",async()=>{
         try{
           if(!await openSavedBatch(batch.id,{inspect:true}))return;
           const link=document.querySelector('[data-module="questions"]');
           if(link)link.click();
           setStudioView("focus");
         }catch(e){status.textContent=e.message}
       });
       action.append(open);tr.append(name,state,when,action);tbody.append(tr);
     }
     status.textContent="These are new-question batch statuses. Independent reviewers are not onboarded yet; a pending request is not a completed review.";
   }catch(e){const tr=document.createElement("tr"),td=cell("td","Unable to load batch statuses.");td.colSpan=4;tr.append(td);tbody.append(tr);status.textContent=e.message}
 }
 $("review-refresh-new-batches").addEventListener("click",showNewBatchReviewStatuses);
 window.addEventListener("mednest:module",event=>{
   if(event.detail?.key==="reviews")showNewBatchReviewStatuses();
 });
 $("studio-refresh-batches").addEventListener("click",async()=>{
   busy(true);
   try{await reloadBatchList();storageStatus("Protected draft batches refreshed.");}
   catch(e){storageStatus(e.message,true)}
   finally{busy(false)}
 });

 $("studio-save-batch").addEventListener("click",async()=>{
   try{
     if(saveInFlight)return;
     if(formChanged())throw Error("Save the currently open question before saving the batch.");
     if(!drafts.length)throw Error("Add or import a question first.");
     const result=await saveDraftItems(drafts,{
       updateAll:true,
       onProgress:(done,total)=>storageStatus("Securely saved "+done+" of "+total+" questions…")
     });
     storageStatus("Protected draft saved · "+result.saved+" questions. Student publication remains disabled.");
     focusStateMessage("All "+result.saved+" questions saved to your protected draft.");
     try{await reloadBatchList();$("studio-saved-batches").value=savedBatchId}
     catch{storageStatus("Draft saved. Refresh the list if its label is not updated.")}
   }catch(e){
     storageStatus(e.message,true);
     focusStateMessage("Batch not fully saved: "+e.message,true);
   }
 });

 async function openSavedBatch(id,{inspect=false}={}){
   if(saveInFlight)return false;
   if(!id){storageStatus("Choose a saved draft first.",true);return false}
   // Warn only about true unsaved work, not the presence of already-saved rows.
   if((dirty||formChanged()||(studioView==="browse"&&window.MedNestMCQAssist?.hasUnsavedCorrection?.()))&&
      !window.confirm("Your current draft has unsaved changes. Open another saved draft without saving those changes?"))
     return false;
   busy(true);
   try{
     const result=await storage().load(id);
     if(!result.batch?.id||result.batch.id!==id)throw Error("Saved draft could not be verified.");
     const loaded=result.rows.map(row=>({...row,entry:canonicalizeExact(row.entry)}));
     // Apply atomically only after the complete saved batch is available.
     drafts=loaded;selected=-1;page=0;filter="all";focusPage=0;focusLine=null;focusQuery="";
     $("studio-filter").value="all";$("studio-focus-search").value="";
     savedBatchId=id;clientBatchKey=result.batch.client_key;
     savedStatus=result.batch.status||"draft";dirty=false;
     inspectMode=Boolean(inspect);
     editorSnapshot=null;advanceOnSave=false;
     $("studio-batch-name").value=result.batch.title;
     $("studio-batch-name").readOnly=true;
     $("studio-saved-batches").value=id;
     show("studio-editor",false);show("studio-focus-readonly",false);
     render();openWorkspace({inspect});
     storageStatus("Opened "+drafts.length+" saved questions · "+savedStatus.replaceAll("_"," ")+". Nothing published.");
     return true;
   }catch(e){
     storageStatus(e.message,true);focusStateMessage("Unable to open draft: "+e.message,true);return false;
   }finally{busy(false)}
 }
 $("studio-load-batch").addEventListener("click",async()=>{
   const id=$("studio-saved-batches").value;
   await openSavedBatch(id);
 });
 async function changeRoute(action){
   if(!savedBatchId||dirty||formChanged()){storageStatus("Save all question edits securely before selecting an academic route.",true);focusStateMessage("Save the currently open question before requesting review or release preparation.",true);return}
   if(action==="direct"&&!window.confirm("Confirm direct release preparation without another teacher's review? This will NOT publish questions to students."))return;
   if(action==="withdraw"&&!window.confirm("Withdraw this pending academic review and return to draft editing?"))return;
   busy(true);
   try{
     const result=action==="direct"?await storage().prepareDirect(savedBatchId):
       action==="submit"?await storage().submitReview(savedBatchId):
         await storage().withdrawReview(savedBatchId);
     savedStatus=result.batch.status;dirty=false;routeControls();
     storageStatus(result.message||("Draft status: "+savedStatus.replaceAll("_"," ")+". No student publication."));
     await reloadBatchList();$("studio-saved-batches").value=savedBatchId;
   }catch(e){storageStatus(e.message,true)}
   finally{busy(false)}
 }
 $("studio-review-submit").addEventListener("click",()=>changeRoute("submit"));
 $("studio-direct-prepare").addEventListener("click",()=>changeRoute("direct"));
 $("studio-withdraw-review").addEventListener("click",()=>changeRoute("withdraw"));
 window.addEventListener("mednest:signed-out",()=>{
   // Browser memory must not retain sensitive staff draft content after sign-out.
   drafts=[];selected=-1;filter="all";page=0;
   savedBatchId=null;clientBatchKey=null;savedStatus="unsaved";dirty=false;
   $("studio-batch-name").readOnly=false;
   $("studio-saved-batches").replaceChildren(new Option("Select a saved draft batch",""));
   writeEditor({});$("studio-batch-name").value="Unpublished MCQ Review Batch";
   $("studio-file").value="";renameProposals=[];renderRenamePlan();
   show("studio-editor",false);show("studio-taxonomy-editor",false);render();
   storageStatus("Signed out. Browser draft data cleared; saved Management Auth batches remain protected.");
 });
 $("studio-editor").classList.add("is-hidden");
 $("studio-focus-editor-stage").append($("studio-editor"));
 setStudioView("drafts");
 window.addEventListener("mednest:authorized",()=>reloadBatchList().catch(e=>storageStatus(e.message,true)));
 render();
})();
