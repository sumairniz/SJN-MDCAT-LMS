/* SJN MedNest Excel importer — browser-native XLSX reader, no external CDN.
 * Only tabular text from the first worksheet; no formulas, macros or XML entities.
 * Nothing is uploaded or published. Size and ZIP expansion bounded.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.MedNestXLSX=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const compressedMax=20_000_000,entryMax=12_000_000,totalMax=24_000_000;
 const decoder=new TextDecoder("utf-8",{fatal:true});
 const u16=(b,i)=>b[i]|(b[i+1]<<8);
 const u32=(b,i)=>(b[i]|b[i+1]<<8|b[i+2]<<16|b[i+3]<<24)>>>0;
 const xmlDoc=text=>{
   if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error("XLSX XML entities and DTDs are not allowed.");
   if(typeof DOMParser==="undefined")throw Error("XLSX parsing requires a browser DOMParser.");
   const doc=new DOMParser().parseFromString(text,"application/xml");
   if(doc.getElementsByTagName("parsererror").length)throw Error("Malformed XLSX XML.");
   return doc;
 };
 const tag=(parent,name)=>[...parent.getElementsByTagName("*")].filter(x=>x.localName===name);
 const first=(parent,name)=>tag(parent,name)[0]||null;
 const column=s=>{
   const m=/^([A-Z]{1,3})[1-9][0-9]*$/.exec(String(s||"").toUpperCase());
   if(!m)throw Error("Unsupported spreadsheet cell address.");
   return [...m[1]].reduce((n,c)=>n*26+(c.charCodeAt(0)-64),0)-1;
 };
 async function unzip(buffer){
   const b=new Uint8Array(buffer);
   if(b.length>compressedMax)throw Error("XLSX file exceeds 20 MB.");
   let end=-1;
   for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--){
     if(u32(b,i)===0x06054b50){end=i;break}
   }
   if(end<0)throw Error("XLSX ZIP directory missing.");
   const count=u16(b,end+10),cdLen=u32(b,end+12),cdPos=u32(b,end+16);
   if(count>1500||cdPos+cdLen>b.length)throw Error("XLSX archive is too large or malformed.");
   const out=new Map();let pos=cdPos,total=0;
   for(let i=0;i<count;i++){
     if(u32(b,pos)!==0x02014b50)throw Error("Malformed XLSX entry directory.");
     const flags=u16(b,pos+8),method=u16(b,pos+10);
     const packed=u32(b,pos+20),unpacked=u32(b,pos+24);
     const namelen=u16(b,pos+28),extra=u16(b,pos+30),comment=u16(b,pos+32),offset=u32(b,pos+42);
     const name=decoder.decode(b.slice(pos+46,pos+46+namelen));
     pos+=46+namelen+extra+comment;
     if(!["xl/workbook.xml","xl/_rels/workbook.xml.rels","xl/sharedStrings.xml"].includes(name)&&
       !/^xl\/worksheets\/[^/]+\.xml$/.test(name))continue;
     if(flags&1)throw Error("Encrypted Excel files are not supported.");
     if(method!==0&&method!==8)throw Error("Unsupported Excel compression method.");
     if(unpacked>entryMax||packed>compressedMax||total+unpacked>totalMax)
       throw Error("XLSX exceeds safe decompression limits.");
     total+=unpacked;
     if(u32(b,offset)!==0x04034b50)throw Error("Malformed XLSX entry.");
     const localStart=offset+30+u16(b,offset+26)+u16(b,offset+28);
     if(localStart+packed>b.length)throw Error("Truncated XLSX archive.");
     const bytes=b.slice(localStart,localStart+packed);
     let decompressed=bytes;
     if(method===8){
       if(typeof DecompressionStream==="undefined")
         throw Error("Your browser cannot extract Excel files; use CSV import.");
       const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
       const reader=stream.getReader(),chunks=[];let read=0;
       try{
         while(true){
           const {done,value}=await reader.read();
           if(done)break;
           read+=value.length;
           if(read>entryMax||read>unpacked){await reader.cancel();throw Error("Excel entry exceeds its declared size.")}
           chunks.push(value);
         }
       }finally{reader.releaseLock()}
       decompressed=new Uint8Array(read);
       let at=0;for(const chunk of chunks){decompressed.set(chunk,at);at+=chunk.length}
     }
     if(decompressed.length!==unpacked)throw Error("XLSX archive size mismatch.");
     out.set(name,decoder.decode(decompressed));
   }
   return out;
 }
 function parseSheet(xml,strings){
   const doc=xmlDoc(xml),rows=[];
   for(const row of tag(doc,"row")){
     const rowNum=Number(row.getAttribute("r"));
     if(!Number.isInteger(rowNum)||rowNum<1||rowNum>10001)
       throw Error("Excel supports a header plus 10,000 rows per import.");
     const cols=[];
     for(const c of [...row.children].filter(x=>x.localName==="c")){
       const cidx=column(c.getAttribute("r"));
       if(cidx>50)throw Error("Excel import accepts up to 51 columns.");
       if(first(c,"f"))throw Error("Excel formulas must be replaced with plain values before import.");
       let value="";
       const type=c.getAttribute("t");
       const v=first(c,"v")?.textContent||"";
       if(type==="s"){
         const index=Number(v);if(!Number.isInteger(index)||index<0||index>=strings.length)
           throw Error("Invalid XLSX shared-string index.");
         value=strings[index];
       }else if(type==="inlineStr"){
         const inline=first(c,"is");
         value=inline?tag(inline,"t").map(t=>t.textContent||"").join(""):"";
       }else if(type==="e")throw Error("Excel error cell found. Fix the spreadsheet before importing.");
       else value=v;
       cols[cidx]=value;
     }
     while(cols.length&&cols[cols.length-1]===undefined)cols.pop();
     if(!cols.some(x=>String(x??"").trim()))continue;
     rows[rowNum-1]=cols.map(x=>String(x??""));
   }
   return rows.filter(Boolean);
 }
 async function readXLSX(arrayBuffer){
   const entries=await unzip(arrayBuffer);
   if(!entries.has("xl/workbook.xml"))throw Error("XLSX workbook metadata missing.");
   const workbook=xmlDoc(entries.get("xl/workbook.xml"));
   const sheets=tag(workbook,"sheet");
   if(!sheets.length)throw Error("Excel workbook has no worksheets.");
   // This importer intentionally supports sheet1.xml only; no silent sheet switching.
   const firstName=sheets[0].getAttribute("name")||"Sheet 1";
   const firstId=sheets[0].getAttribute("r:id")||
     [...sheets[0].attributes].find(a=>a.localName==="id")?.value;
   const relText=entries.get("xl/_rels/workbook.xml.rels");
   if(!relText)throw Error("XLSX workbook relationships missing.");
   const rels=tag(xmlDoc(relText),"Relationship");
   const relation=rels.find(x=>x.getAttribute("Id")===firstId);
   if(!relation||relation.getAttribute("TargetMode")==="External")
     throw Error("First Excel worksheet is missing or external.");
   const target=relation.getAttribute("Target")||"";
   const sheetPath=target.startsWith("/")?target.slice(1):
     "xl/"+target.replace(/^\.\//,"");
   if(!/^xl\/worksheets\/[^/]+\.xml$/.test(sheetPath)||!entries.has(sheetPath))
     throw Error("Unsupported Excel worksheet path.");
   const strings=entries.has("xl/sharedStrings.xml")
     ?tag(xmlDoc(entries.get("xl/sharedStrings.xml")),"si").map(si=>tag(si,"t").map(t=>t.textContent||"").join("")):[];
   return {sheet:firstName,sheets:sheets.length,rows:parseSheet(entries.get(sheetPath),strings)};
 }
 function toCSV(rows){
   const quote=x=>'"'+String(x??"").replace(/"/g,'""')+'"';
   const columns=Math.max(0,...rows.map(r=>r.length));
   return rows.map(r=>Array.from({length:columns},(_,i)=>quote(r[i]??"")).join(",")).join("\r\n");
 }
 return Object.freeze({readXLSX,toCSV});
});
