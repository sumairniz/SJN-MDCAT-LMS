"use strict";
// SJN MedNest Content Studio — local draft editor/import review. No database writes.
(function(){
 const core=window.MedNestContentStudio;
 const $=id=>document.getElementById(id);
 if(!core||!$("content-studio-preview"))return;
 let drafts=[],selected=-1,filter="all",page=0;
 let savedBatchId=null,clientBatchKey=null,savedStatus="unsaved",dirty=false,advanceOnSave=false;
 const taxonomy=window.MedNestTaxonomy;
 let catalog=null,taxonomyReviewLine=null;
 const canon=s=>String(s||"").trim().replace(/\s+/g," ").toLocaleLowerCase("en");
 const PAGE_SIZE=40;
 function routeControls(){
   const state=savedStatus;
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
     const status=cell("span",item.status.toUpperCase(),"studio-status studio-status--"+item.status);
     const td1=document.createElement("td");td1.append(status);
     const td2=cell("td",item.entry.bank||"—");
     const td3=cell("td",[item.entry.subject||"Unclassified",item.entry.chapter||"No chapter",item.entry.topic||"Unmapped topic"].join(" → "));
     const td4=cell("td",item.entry.question||"(missing statement)","studio-question-cell");
     const td5=document.createElement("td");
     const button=cell("button","Review / Edit","studio-edit");button.type="button";
     button.addEventListener("click",()=>openEditor(item.line));
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
   const index=drafts.findIndex(x=>x.line===line);
   if(index<0)return;
   selected=index;writeEditor(drafts[index].entry);
   $("studio-editor-heading").textContent="Review draft row "+line;
   $("studio-save").textContent="Update Draft";
   show("studio-editor",true);
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
     if(entries.length+drafts.length>core.MAX_ROWS)throw Error("Draft preview can hold up to 10,000 rows.");
     const nextLine=drafts.length?Math.max(...drafts.map(x=>x.line))+1:1;
     drafts.push(...entries.map((x,i)=>({line:nextLine+i,entry:canonicalizeExact(x.entry)})));
     modified();page=0;filter="all";$("studio-filter").value="all";render();
     feedback("Imported "+entries.length+" rows into draft review. Match uncertain topics before publishing. No LMS content changed.");
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
   if(savedStatus==="pending_review"||savedStatus==="approved_for_release"){
     feedback("This draft is locked after submission. Start Another Draft or withdraw a pending request first.",true);return;
   }
   const last=drafts[drafts.length-1]?.entry||{};
   selected=-1;writeEditor({bank:last.bank||"SJN Question Bank",subject:last.subject||"Biology",
     chapter:last.chapter||"",topic:last.topic||"",source:last.source||"",
     region:last.region||"",year:last.year||"",paper_code:last.paper_code||""});
   $("studio-editor-heading").textContent="Add question "+(drafts.length+1)+" to this draft";
   $("studio-save").textContent="Save Question";
   show("studio-editor",true);
   window.MedNestMCQAssist?.previewNew();
   $("studio-question").focus();
 });
 $("studio-cancel").addEventListener("click",()=>{selected=-1;advanceOnSave=false;show("studio-editor",false)});
 $("studio-save-next").addEventListener("click",()=>{
   advanceOnSave=true;
   $("studio-editor-form").requestSubmit();
 });
 $("studio-new-set").addEventListener("click",()=>{
   if(dirty&&drafts.length&&!window.confirm("This working draft has unsaved changes. Start a new draft without saving them?"))return;
   drafts=[];selected=-1;page=0;filter="all";savedBatchId=null;clientBatchKey=null;
   savedStatus="unsaved";dirty=false;
   $("studio-filter").value="all";$("studio-batch-name").value="New MCQ Draft";
   $("studio-saved-batches").value="";show("studio-editor",false);render();
   storageStatus("New blank draft ready. Add questions manually or import an Excel file.");
 });
 $("studio-editor-form").addEventListener("submit",event=>{
   event.preventDefault();
   const entry=canonicalizeExact(readEditor()),result=core.validate(entry);
   if(result.errors.length){
     advanceOnSave=false;
     feedback("Draft validation: "+result.errors.join(" "),true);
     return;
   }
   if(selected>=0)drafts[selected].entry=entry;
   else {
     const nextLine=drafts.length?Math.max(...drafts.map(x=>x.line))+1:1;
     drafts.push({line:nextLine,entry});
   }
   const next=advanceOnSave;advanceOnSave=false;
   modified();selected=-1;show("studio-editor",false);render();
   if(next)$("studio-new").click();
   feedback("New MCQ draft updated in this browser session only. "+(result.warnings.length?result.warnings.join(" "):"Ready for validation.")+" Save Draft Batch to retain it securely. This is NOT yet an Academic Reviews submission or student publication.");
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
 $("studio-refresh-batches").addEventListener("click",async()=>{
   busy(true);
   try{await reloadBatchList();storageStatus("Protected draft batches refreshed.");}
   catch(e){storageStatus(e.message,true)}
   finally{busy(false)}
 });
 $("studio-save-batch").addEventListener("click",async()=>{
   busy(true);
   const currentBatchId=savedBatchId;
   try{
     if(!drafts.length)throw Error("Add or import MCQ drafts first.");
     if(savedStatus==="pending_review"||savedStatus==="approved_for_release")throw Error("Submitted or approved drafts cannot be edited.");
     const title=$("studio-batch-name").value.trim();
     if(!title)throw Error("Enter a name for this draft batch.");
     if(drafts.length>3000)throw Error("Protected storage supports 3,000 rows per batch. Split larger imports.");
     // Keep idempotency token in memory to safely resume failed chunk uploads.
     if(!clientBatchKey)clientBatchKey=window.crypto.randomUUID();
     const result=await storage().save({
       batchId:currentBatchId,clientKey:clientBatchKey,title,items:drafts,
       onProgress:(done,total)=>storageStatus("Securely saved "+done+" of "+total+" draft rows…")
     });
     savedBatchId=result.batchId;
     clientBatchKey=result.clientKey;
     savedStatus="draft";dirty=false;routeControls();
     storageStatus("Saved "+result.saved+" draft rows to Management Auth. This did NOT publish or alter student MCQs.");
     await reloadBatchList();
     $("studio-saved-batches").value=savedBatchId;
   }catch(e){storageStatus(e.message,true)}
   finally{busy(false)}
 });
 $("studio-load-batch").addEventListener("click",async()=>{
   const id=$("studio-saved-batches").value;
   if(!id){storageStatus("Choose a saved draft batch first.",true);return;}
   if(drafts.length&&!window.confirm("Replace current browser drafts with the selected saved batch? Export unsaved changes first."))return;
   busy(true);
   try{
     const result=await storage().load(id);
     if(!result.batch?.id||result.batch.id!==id)throw Error("Saved batch could not be verified.");
     // Apply only after every page has loaded successfully.
     drafts=result.rows.map(row=>({...row,entry:canonicalizeExact(row.entry)}));
     selected=-1;page=0;filter="all";$("studio-filter").value="all";
     savedBatchId=id;clientBatchKey=result.batch.client_key;
     savedStatus=result.batch.status||"draft";dirty=false;routeControls();
     $("studio-batch-name").value=result.batch.title;
     show("studio-editor",false);render();
     storageStatus("Opened "+drafts.length+" saved questions. Status: "+savedStatus.replaceAll("_"," ")+". Nothing published.");
   }catch(e){storageStatus(e.message,true)}
   finally{busy(false)}
 });

 async function changeRoute(action){
   if(!savedBatchId||dirty){storageStatus("Save all question changes before selecting an academic route.",true);return}
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
   $("studio-saved-batches").replaceChildren(new Option("Select a saved draft batch",""));
   writeEditor({});$("studio-batch-name").value="Unpublished MCQ Review Batch";
   $("studio-file").value="";renameProposals=[];renderRenamePlan();
   show("studio-editor",false);show("studio-taxonomy-editor",false);render();
   storageStatus("Signed out. Browser draft data cleared; saved Management Auth batches remain protected.");
 });
 $("studio-editor").classList.add("is-hidden");
 window.addEventListener("mednest:authorized",()=>reloadBatchList().catch(e=>storageStatus(e.message,true)));
 render();
})();
