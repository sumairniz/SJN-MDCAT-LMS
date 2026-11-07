/* SJN MedNest Content Studio: browser/Node validation engine, draft-only.
 * No student APIs, no database writes, no auto-correction of past-paper wording.
 * Metadata is a draft proposal requiring separate publication approval.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.MedNestContentStudio=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const BANKS=Object.freeze(["SJN Question Bank","Past Papers Question Bank"]);
  const SUBJECTS=Object.freeze(["Biology","Chemistry","Physics","English","Logical Reasoning"]);
  const HEADERS=Object.freeze(["bank","subject","chapter","topic","question","option_a","option_b","option_c","option_d","correct_option","explanation","mnemonic","source","region","year","paper_code"]);
  const MAX_FILE_CHARS=7_500_000;
  const MAX_ROWS=10_000;
  const required=Object.freeze(["bank","subject","chapter","topic","question","option_a","option_b","option_c","option_d","correct_option"]);
  const hasValue=x=>typeof x==="string"&&x.trim().length>0;
  function parseCSV(text){
    if(typeof text!=="string"||text.length>MAX_FILE_CHARS)throw Error("CSV must be a text file under 7.5 million characters.");
    const input=text.charCodeAt(0)===0xfeff?text.slice(1):text;
    const rows=[];let cells=[],cell="",quoted=false,afterQuote=false;
    for(let i=0;i<input.length;i++){
      const c=input[i];
      if(quoted){
        if(c==='"'&&input[i+1]==='"'){cell+='"';i++}
        else if(c==='"'){quoted=false;afterQuote=true}
        else cell+=c;
      }else if(afterQuote){
        if(c===","){cells.push(cell);cell="";afterQuote=false}
        else if(c==="\r"||c==="\n"){
          cells.push(cell);cell="";afterQuote=false;
          if(c==="\r"&&input[i+1]==="\n")i++;
          rows.push(cells);cells=[];
        }else if(c!==" "&&c!=="\t")throw Error("Unexpected character after closing quote; check CSV escaping.");
      }else if(c==='"'){
        if(cell.length)throw Error("Quote must start at the beginning of a CSV field.");
        quoted=true;
      }else if(c===","){cells.push(cell);cell=""}
      else if(c==="\r"||c==="\n"){
        cells.push(cell);cell="";
        if(c==="\r"&&input[i+1]==="\n")i++;
        rows.push(cells);cells=[];
      }else cell+=c;
      if(rows.length>MAX_ROWS+1)throw Error("CSV exceeds the safe 10,000-row draft preview limit. Split it into batches.");
    }
    if(quoted)throw Error("CSV contains an unclosed quoted field.");
    if(cell.length||cells.length||afterQuote){cells.push(cell);rows.push(cells)}
    return rows.filter(row=>row.some(hasValue));
  }
  function rowObject(headers,values){
    const out={};
    headers.forEach((header,index)=>{out[header]=values[index]??""});
    return out;
  }
  function importCSV(text){
    const raw=parseCSV(text);
    if(!raw.length)throw Error("CSV is empty.");
    const headers=raw[0].map(x=>x.trim().toLowerCase());
    if(new Set(headers).size!==headers.length)throw Error("CSV has duplicate header names.");
    const missing=required.filter(name=>!headers.includes(name));
    if(missing.length)throw Error("Missing required CSV columns: "+missing.join(", "));
    const unknown=headers.filter(name=>!HEADERS.includes(name));
    if(unknown.length)throw Error("Unknown CSV columns: "+unknown.join(", ")+". Use the provided template.");
    return raw.slice(1).map((values,index)=>{
      const entry=rowObject(headers,values);
      if(values.length!==headers.length)entry.__csv_error="Column count mismatch; check commas and quoted fields.";
      return {line:index+2,entry};
    });
  }
  function validate(entry){
    const errors=[],warnings=[];
    const text=key=>typeof entry[key]==="string"?entry[key]:"";
    if(!BANKS.includes(text("bank")))errors.push("Choose an existing ordinary Question Bank.");
    if(!SUBJECTS.includes(text("subject")))errors.push("Choose a supported subject.");
    for(const field of ["chapter","topic","question","option_a","option_b","option_c","option_d"]){
      if(!hasValue(text(field)))errors.push(field.replace(/_/g," ")+" is required.");
    }
    for(const field of ["question","option_a","option_b","option_c","option_d"]){
      if(text(field).length>6000)errors.push(field.replace(/_/g," ")+" exceeds 6,000 characters.");
    }
    if(entry.__csv_error)errors.push(entry.__csv_error);
    const opts=["option_a","option_b","option_c","option_d"].map(text);
    if(opts.every(hasValue)&&new Set(opts.map(x=>x.trim().toLowerCase())).size<4)
      warnings.push("Repeated answer options: review before submitting.");
    const answer=text("correct_option").trim().toUpperCase();
    if(!["A","B","C","D"].includes(answer))
      errors.push("Correct option must be A, B, C or D.");
    if(text("bank")==="Past Papers Question Bank"&&!hasValue(text("source")))
      errors.push("Original past-paper source is required and must remain traceable.");
    if(["English","Logical Reasoning"].includes(text("subject"))&&
       hasValue(text("chapter"))&&hasValue(text("topic"))&&
       text("chapter").trim()!==text("topic").trim())
      warnings.push("For English/LR, chapter and topic should match the approved taxonomy.");
    const region=text("region").trim().toLowerCase();
    if(region&&!["sindh","punjab","kpk","balochistan","federal","nums"].includes(region))
      warnings.push("Region is not one of the approved six region labels.");
    if(text("year").trim()&&!/^20\d{2}$/.test(text("year").trim()))
      warnings.push("Paper year should use a four-digit year like 2025.");
    if(text("bank")==="SJN Question Bank"&&hasValue(text("paper_code")))
      warnings.push("Paper code was supplied for an academy-curated question.");
    return {errors,warnings,correct_index:["A","B","C","D"].indexOf(answer)};
  }
  function fingerprint(row){
    const f=key=>String(row[key]||"").trim().replace(/\s+/g," ").toLowerCase();
    return ["bank","question","option_a","option_b","option_c","option_d"].map(f).join("\u001f");
  }
  function inspectDrafts(input){
    if(!Array.isArray(input)||input.length>MAX_ROWS)throw Error("Draft must contain no more than 10,000 rows.");
    const seen=new Map();
    return input.map((item,index)=>{
      const entry=item.entry||item;
      const line=item.line||index+1;
      const result=validate(entry);
      const fp=fingerprint(entry);
      if(seen.has(fp))result.warnings.push("Possible duplicate of draft row "+seen.get(fp)+".");
      else seen.set(fp,line);
      return {line,entry,errors:result.errors,warnings:result.warnings,
        correct_index:result.correct_index,status:result.errors.length?"invalid":result.warnings.length?"review":"ready"};
    });
  }
  function exportDrafts(items){
    const reviewed=inspectDrafts(items);
    return {
      format:"SJN-MEDNEST-CONTENT-STUDIO-DRAFT-v1",
      purpose:"unpublished_review_only",
      created_at:new Date().toISOString(),
      total:reviewed.length,
      entries:reviewed.map(({line,entry,errors,warnings,correct_index,status})=>({
        line,status,errors,warnings,
        fields:Object.fromEntries(HEADERS.map(name=>[name,String(entry[name]||"")])),
        proposed_correct_index:correct_index
      }))
    };
  }
  function csvTemplate(){
    const example=[
      "Past Papers Question Bank","Biology","Biological Molecules",
      "Introduction to Biological Molecules","Insert original question exactly",
      "Option A","Option B","Option C","Option D","B",
      "Brief textbook-aligned explanation","","UHS 2025","punjab","2025",""
    ];
    const quote=s=>'"'+String(s).replace(/"/g,'""')+'"';
    return HEADERS.map(quote).join(",")+"\r\n"+example.map(quote).join(",")+"\r\n";
  }
  return Object.freeze({BANKS,SUBJECTS,HEADERS,MAX_ROWS,MAX_FILE_CHARS,
    parseCSV,importCSV,validate,inspectDrafts,exportDrafts,csvTemplate});
});
