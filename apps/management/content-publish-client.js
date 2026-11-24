// Shared browser-side transport for the Student LMS Staging publisher.
// Only the publishable key is present here; privileged credentials remain in Supabase Edge Functions.
const STUDENT_URL="https://aozknkrwafowsrehdwlr.supabase.co";
const STUDENT_KEY="sb_publishable_9CjKnd4hEIIvS7OXvTq_aA_tTkLsBts";
const API=STUDENT_URL+"/functions/v1/mednest-content-publish";
async function post(action,payload,managementAccessToken){
 if(typeof managementAccessToken!=="string"||!managementAccessToken)throw Error("Sign in to Management Auth before publishing.");
 const response=await fetch(API,{method:"POST",cache:"no-store",credentials:"omit",
  headers:{"content-type":"application/json","apikey":STUDENT_KEY,"authorization":"Bearer "+managementAccessToken},
  body:JSON.stringify({action,...payload})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||"Student LMS Staging publishing failed.");
 return data;
}
export async function publishBatch(batchId,managementAccessToken,{onProgress,expectedCount}={}){
 if(!/^[0-9a-f-]{36}$/i.test(batchId||""))throw Error("Open an approved saved batch before publishing.");
 let start=1,published=0,chunks=0;const receipts=[];
 for(let attempt=0;attempt<76;attempt++){
  const data=await post("batch.publish_chunk",{batch_id:batchId,start},managementAccessToken);
  if(!Number.isInteger(data.published_count)||!Array.isArray(data.items))throw Error("Student LMS returned an invalid publication receipt.");
  published+=data.published_count;chunks++;receipts.push(...data.items);
  onProgress?.(published,expectedCount||null,chunks);
  if(!data.has_more)return {batchId,published,chunks,receipts};
  if(!Number.isInteger(data.next_start)||data.next_start<=start||data.next_start>3000)throw Error("Invalid next-chunk cursor; completed chunks remain safely recorded.");
  start=data.next_start;
 }
 throw Error("Batch exceeded the safe chunk limit. Published "+published+" questions; retry after inspecting the release receipts.");
}
export async function publishCorrection(submissionId,managementAccessToken){
 if(!/^[0-9a-f-]{36}$/i.test(submissionId||""))throw Error("Approved correction submission ID is invalid.");
 const result=await post("mcq.publish_correction",{submission_id:submissionId},managementAccessToken);
 const item=result.items?.[0];if(!item)throw Error("Student LMS returned no revision receipt.");
 return {replayed:!!result.replayed,item};
}
