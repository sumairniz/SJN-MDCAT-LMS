/* Offline Excel template writer for unpublished Management question-bank drafts.
   Produces a standards-compliant ZIP/XLSX with one ordinary, text-only sheet. */
(function(root){
 "use strict";
 const encoder=new TextEncoder();
 const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
 const table=new Uint32Array(256);
 for(let n=0;n<256;n++){
  let c=n;
  for(let j=0;j<8;j++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
  table[n]=c>>>0;
 }
 function crc(bytes){
  let c=0xffffffff;
  for(const b of bytes)c=table[(c^b)&255]^(c>>>8);
  return (c^0xffffffff)>>>0;
 }
 const u16=(d,v)=>{d.push(v&255,(v>>>8)&255)};
 const u32=(d,v)=>{u16(d,v&65535);u16(d,v>>>16)};
 function zip(files){
  const parts=[],directory=[];let offset=0;
  for(const [name,content] of files){
   const filename=encoder.encode(name),data=encoder.encode(content),hash=crc(data);
   const local=[];u32(local,0x04034b50);u16(local,20);u16(local,0);
   u16(local,0);u16(local,0);u16(local,0);u32(local,hash);
   u32(local,data.length);u32(local,data.length);u16(local,filename.length);u16(local,0);
   parts.push(new Uint8Array(local),filename,data);
   const entry=[];u32(entry,0x02014b50);u16(entry,20);u16(entry,20);
   u16(entry,0);u16(entry,0);u16(entry,0);u16(entry,0);u32(entry,hash);
   u32(entry,data.length);u32(entry,data.length);
   u16(entry,filename.length);u16(entry,0);u16(entry,0);
   u16(entry,0);u16(entry,0);u32(entry,0);u32(entry,offset);
   directory.push(new Uint8Array(entry),filename);
   offset+=local.length+filename.length+data.length;
  }
  const dirLength=directory.reduce((n,x)=>n+x.length,0);
  const end=[];u32(end,0x06054b50);u16(end,0);u16(end,0);
  u16(end,files.length);u16(end,files.length);u32(end,dirLength);
  u32(end,offset);u16(end,0);
  return new Blob([...parts,...directory,new Uint8Array(end)],{
   type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
 }
 function col(index){
  let out="",n=index+1;
  while(n>0){n--;out=String.fromCharCode(65+n%26)+out;n=Math.floor(n/26)}
  return out;
 }
 function create(rows){
  if(!Array.isArray(rows)||!rows.length||rows.length>10001)throw Error("Invalid Excel template rows.");
  const body=rows.map((cells,i)=>'<row r="'+(i+1)+'">'+cells.map((v,j)=>{
   const cell=col(j)+(i+1);
   return '<c r="'+cell+'" t="inlineStr"><is><t xml:space="preserve">'+esc(v)+'</t></is></c>';
  }).join("")+"</row>").join("");
  const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
   '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
   '<sheetData>'+body+'</sheetData></worksheet>';
  const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
   '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'+
   ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
   '<sheets><sheet name="MCQ Import" sheetId="1" r:id="rId1"/></sheets></workbook>';
  const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"'+
   ' Target="worksheets/sheet1.xml"/></Relationships>';
  const rootRels='<?xml version="1.0" encoding="UTF-8"?>'+
   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  const types='<?xml version="1.0" encoding="UTF-8"?>'+
   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
   '<Default Extension="xml" ContentType="application/xml"/>'+
   '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
   '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
  return zip([["[Content_Types].xml",types],["_rels/.rels",rootRels],
   ["xl/workbook.xml",workbook],["xl/_rels/workbook.xml.rels",rels],
   ["xl/worksheets/sheet1.xml",sheet]]);
 }
 root.MedNestXLSXTemplate=Object.freeze({create});
})(typeof window!=="undefined"?window:globalThis);