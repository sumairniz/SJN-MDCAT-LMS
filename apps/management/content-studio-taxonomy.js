/* SJN MedNest taxonomy reconciliation v1.
 * Input and publication remain separate. No auto-rename of existing MCQs.
 * Exact matching is case/whitespace insensitive only; suggestions require review.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.MedNestTaxonomy=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const normalize=s=>String(s??"").normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("en");
 const fold=s=>normalize(s).replace(/[’‘]/g,"'").replace(/[‐‑‒–—]/g,"-")
   .replace(/[^\p{L}\p{N}]+/gu,"");
 const distance=(a,b)=>{
   if(a===b)return 0;
   if(Math.abs(a.length-b.length)>5)return 99;
   const last=Array.from({length:b.length+1},(_,i)=>i);
   for(let i=1;i<=a.length;i++){
     let previous=last[0];last[0]=i;
     for(let j=1;j<=b.length;j++){
       const saved=last[j];
       last[j]=Math.min(last[j]+1,last[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));
       previous=saved;
     }
   }
   return last[b.length];
 };
 function catalogue(entries){
  if(!Array.isArray(entries))throw Error("Taxonomy metadata must be a list.");
  const chapters=new Map(),topics=new Map(),subjectNames=new Map();
  const add=(map,key,value,count)=>{
   let bucket=map.get(key);
   if(!bucket){bucket=new Map();map.set(key,bucket)}
   const norm=normalize(value);
   const prev=bucket.get(norm);
   if(!prev||count>prev.count)bucket.set(norm,{label:String(value).trim(),count});
  };
  for(const row of entries){
   if(!row||typeof row.subject!=="string"||typeof row.chapter!=="string"||typeof row.topic!=="string")continue;
   const s=normalize(row.subject),c=normalize(row.chapter);
   if(!s||!c||!normalize(row.topic))continue;
   const n=Math.max(0,Number(row.usage_count)||0);
   subjectNames.set(s,row.subject);
   add(chapters,s,row.chapter,n);
   add(topics,s+"\u001f"+c,row.topic,n);
  }
  const values=(map,key)=>[...(map.get(key)?.values()||[])].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));
  return Object.freeze({
   subjects:()=>[...subjectNames.values()].sort(),
   chapters:subject=>values(chapters,normalize(subject)),
   topics:(subject,chapter)=>values(topics,normalize(subject)+"\u001f"+normalize(chapter)),
   isEmpty:()=>topics.size===0
  });
 }
 function choose(input,candidates){
  const normalized=normalize(input);
  if(!normalized)return {status:"missing",original:input,candidates:[]};
  const exact=candidates.filter(item=>normalize(item.label)===normalized);
  if(exact.length===1)return {status:"exact",original:input,canonical:exact[0].label,candidates:[]};
  if(exact.length>1)return {status:"ambiguous",original:input,candidates:exact};
  const simplified=fold(input);
  const suggestions=candidates.map(item=>{
    const other=fold(item.label),d=distance(simplified,other);
    const maxLen=Math.max(simplified.length,other.length);
    const similarity=maxLen?1-d/maxLen:0;
    return {...item,similarity,d};
  }).filter(item=>item.similarity>=0.74&&item.d<=Math.max(2,Math.floor(simplified.length/5)))
   .sort((a,b)=>b.similarity-a.similarity||b.count-a.count).slice(0,5);
  return {
    status:suggestions.length?"suggestion":"new",
    original:input,candidates:suggestions.map(({label,count,similarity})=>({label,count,similarity}))
  };
 }
 function resolve(entry,cat){
  const subject=choose(entry.subject,cat.subjects().map(label=>({label,count:1})));
  const result={subject,chapter:null,topic:null,status:"blocked",issues:[]};
  if(subject.status!=="exact"){result.issues.push("Subject needs approval");return result}
  const chapter=choose(entry.chapter,cat.chapters(subject.canonical));
  result.chapter=chapter;
  if(chapter.status!=="exact"){result.issues.push("Chapter needs approval");return result}
  result.topic=choose(entry.topic,cat.topics(subject.canonical,chapter.canonical));
  if(result.topic.status!=="exact")result.issues.push("Topic needs approval");
  result.status=result.issues.length?"blocked":"matched";
  return result;
 }
 function applySelection(entry,result,choices={}){
  // Only deliberate selections from the current scoped metadata catalogue.
  if(result.subject.status!=="exact")throw Error("Subject must be confirmed first.");
  const subject=result.subject.canonical;
  const chapter=choices.chapter||result.chapter?.canonical;
  if(!chapter||!(choices.chapter?result.chapter?.candidates||[]:[]).length&&result.chapter?.status!=="exact"&&!choices.chapter)
    throw Error("Existing chapter must be explicitly selected.");
  const allowedChapters=result.chapter?.status==="exact"
     ?[result.chapter.canonical]:result.chapter?.candidates.map(x=>x.label)||[];
  if(!allowedChapters.includes(chapter))throw Error("Chapter selection is not in the approved catalogue.");
  const topic=choices.topic||result.topic?.canonical;
  const allowedTopics=result.topic?.status==="exact"
    ?[result.topic.canonical]:result.topic?.candidates.map(x=>x.label)||[];
  if(!topic||!allowedTopics.includes(topic))throw Error("Existing topic must be explicitly selected.");
  const applied={...entry,subject,chapter,topic};
  return applied;
 }
 function auditEntries(entries,cat){
   return entries.map((item,i)=>{
    const entry=item.entry||item;const matched=resolve(entry,cat);
    return {line:item.line??i+1,entry,matched,
     // Suggested spellings are never considered verified matches.
     requires_review:matched.status!=="matched"};
   });
 }
 const RENAME_HEADERS=["subject","chapter","existing_topic","proposed_topic","reason"];
 function renameCSVTemplate(){
   const quote=x=>'"'+String(x||"").replace(/"/g,'""')+'"';
   return RENAME_HEADERS.map(quote).join(",")+"\r\n"+
    ["Biology","Biological Molecules","Carbohydratess","Carbohydrates","Correct spelling only"].map(quote).join(",")+"\r\n";
 }
 function reviewRenamePlan(csvText,cat,parseCSV){
   if(typeof parseCSV!=="function")throw Error("Trusted CSV parser required.");
   const all=parseCSV(csvText);
   if(!all.length)throw Error("Correction CSV is empty.");
   const headers=all[0].map(x=>normalize(x));
   if(headers.join(",")!==RENAME_HEADERS.join(","))
     throw Error("Correction columns must be exactly: "+RENAME_HEADERS.join(", "));
   if(all.length-1>1000)throw Error("Split taxonomy correction plans into 1,000 rows.");
   const seen=new Set();
   return all.slice(1).map((values,i)=>{
     const [subject,chapter,oldTopic,newTopic,reason]=values;
     const problems=[],warnings=[];
     if(values.length!==RENAME_HEADERS.length)problems.push("Column count mismatch.");
     const matchedSubject=cat.subjects().find(x=>normalize(x)===normalize(subject));
     if(!matchedSubject)problems.push("Unknown subject.");
     const matchedChapter=matchedSubject?
       cat.chapters(matchedSubject).find(x=>normalize(x.label)===normalize(chapter)):null;
     if(!matchedChapter)problems.push("Unknown chapter in this subject.");
     const scoped=matchedChapter?cat.topics(matchedSubject,matchedChapter.label):[];
     const original=scoped.find(x=>normalize(x.label)===normalize(oldTopic));
     if(!original)problems.push("Existing topic not found in the selected chapter.");
     if(!String(newTopic||"").trim()||String(newTopic||"").length>160)
       problems.push("Proposed topic must be 1–160 characters.");
     if(normalize(oldTopic)===normalize(newTopic))
       problems.push("No rename required: capitalization and spaces already match.");
     if(scoped.some(x=>normalize(x.label)===normalize(newTopic)))
       problems.push("Target already exists in the same chapter; merging requires a separate reviewed operation.");
     if(!String(reason||"").trim())warnings.push("Provide an academic reason for the correction.");
     const key=[matchedSubject||subject,matchedChapter?.label||chapter,oldTopic].map(normalize).join("\u001f");
     if(seen.has(key))problems.push("Repeated proposal for the same existing topic.");
     seen.add(key);
     return {line:i+2,subject:matchedSubject||subject,chapter:matchedChapter?.label||chapter,
       original:original?.label||oldTopic,proposed:String(newTopic||"").trim(),
       usage_count:original?.count||0,reason:String(reason||"").trim(),problems,warnings,
       status:problems.length?"invalid":"proposed"};
   });
 }
 function exportRenamePlan(rows){
   return {format:"SJN-MEDNEST-TAXONOMY-CORRECTIONS-PROPOSAL-v1",
    purpose:"review_only_no_database_changes",created_at:new Date().toISOString(),
    rows:rows.map(x=>({...x}))};
 }
 return Object.freeze({normalize,fold,distance,catalogue,choose,resolve,applySelection,auditEntries,
   RENAME_HEADERS,renameCSVTemplate,reviewRenamePlan,exportRenamePlan});
});
