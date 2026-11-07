// SJN MedNest Academy — Chief-only existing MCQ Library, safe unpublished edit drafts.
// Student API access is read-only with publishable key. No secret student service role.
// Course-only content deliberately excluded. No publish/delete/MCQ update operations.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.95.0?bundle";
const STAFF_URL=Deno.env.get("SUPABASE_URL")||"";
const STAFF_SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const EXPECTED_STAFF="https://tdqbjhrmfluiinntmjfh.supabase.co";
const STUDENT_URL="https://aozknkrwafowsrehdwlr.supabase.co";
const STUDENT_PUBLISHABLE="sb_publishable_9CjKnd4hEIIvS7OXvTq_aA_tTkLsBts";
const ORIGIN=/^https:\/\/sjn-mednest-management(?:-[a-z0-9]+|-git-sjn-phase1a-foundation)-sjn1\.vercel\.app$/;
const staff=createClient(STAFF_URL,STAFF_SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
const student=createClient(STUDENT_URL,STUDENT_PUBLISHABLE,{auth:{persistSession:false,autoRefreshToken:false}});
const OPERATIONS=new Set(["mcqs.list","mcqs.get","mcqs.drafts","mcqs.save_draft"]);
const BANKS=[
  "Past Papers Question Bank",
  "BUMHS MDCAT Past Papers",
  "KMU MDCAT Past Papers",
  "NUMS MDCAT Past Papers",
  "SIBA MDCAT Past Papers",
  "SZABMU MDCAT Past Papers",
  "UHS MDCAT Past Papers"
];
const ALLOWED=new Set(BANKS);
const PUBLIC_COLUMNS="id,bank,subject,chapter,topic,question,options_json,correct_index,explanation,mnemonic,source,current_revision_id";
const FIELDS=["bank","subject","chapter","topic","source","question","option_a","option_b","option_c","option_d","correct_option","explanation","mnemonic"];
const TEXT_LIMITS={bank:120,subject:80,chapter:160,topic:160,source:250,question:6000,option_a:6000,option_b:6000,option_c:6000,option_d:6000,correct_option:1,explanation:6000,mnemonic:2000};
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid=x=>typeof x==="string"&&ID.test(x);
const reply=(origin,status,data)=>new Response(JSON.stringify(data),{status,headers:{
 "content-type":"application/json","cache-control":"no-store,private",
 "vary":"Origin","access-control-allow-origin":origin||"null","x-content-type-options":"nosniff"
}});
function parseClaims(token){try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}
function originalFields(row){
 if(!Array.isArray(row.options_json)||row.options_json.length!==4
    ||row.options_json.some(x=>typeof x!=="string")
    ||!Number.isInteger(row.correct_index)||row.correct_index<0||row.correct_index>3)
   throw Error("Malformed stored MCQ");
 return {
  bank:row.bank,subject:row.subject,chapter:row.chapter||"",topic:row.topic||"",
  source:row.source||"",question:row.question,
  option_a:row.options_json[0],option_b:row.options_json[1],
  option_c:row.options_json[2],option_d:row.options_json[3],
  correct_option:"ABCD"[row.correct_index],
  explanation:row.explanation||"",mnemonic:row.mnemonic||""
 };
}
function validateEdited(fields,baseBank){
 if(!fields||typeof fields!=="object"||Array.isArray(fields)
    ||Object.keys(fields).length!==FIELDS.length
    ||Object.keys(fields).some(key=>!FIELDS.includes(key)))
   return false;
 for(const k of FIELDS){
  if(typeof fields[k]!=="string"||fields[k].length>TEXT_LIMITS[k]||
    /[\u0000]/.test(fields[k]))return false;
 }
 if(fields.bank!==baseBank||!ALLOWED.has(fields.bank))return false;
 if(!fields.question.trim()||!fields.subject.trim()||
    ["option_a","option_b","option_c","option_d"].some(x=>!fields[x].trim()))
   return false;
 if(!["A","B","C","D"].includes(fields.correct_option))return false;
 return true;
}
async function getStudentMCQ(id){
 const {data,error}=await student.from("mcqs").select(PUBLIC_COLUMNS)
  .eq("id",id).in("bank",BANKS).maybeSingle();
 if(error)throw Error("Student source unavailable");
 return data;
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!ORIGIN.test(origin))return reply("",403,{error:"Management origin denied"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS",
  "access-control-allow-headers":"authorization,apikey,content-type","vary":"Origin"
 }});
 if(req.method!=="POST")return reply(origin,405,{error:"Method not supported"});
 if(STAFF_URL!==EXPECTED_STAFF||!STAFF_SERVICE||!STUDENT_PUBLISHABLE.startsWith("sb_publishable_"))
  return reply(origin,503,{error:"MCQ library backend unavailable"});
 let body;
 try{
  const raw=await req.text();if(raw.length>75000)throw Error("size");
  body=JSON.parse(raw);if(!OPERATIONS.has(body?.action))throw Error("action");
 }catch{return reply(origin,400,{error:"Invalid request"})}
 const authorization=req.headers.get("authorization")||"";
 if(!/^Bearer [a-zA-Z0-9._-]+$/.test(authorization))
  return reply(origin,401,{error:"Management sign-in required"});
 const token=authorization.slice(7),claims=parseClaims(token);
 if(!claims||claims.iss!==EXPECTED_STAFF+"/auth/v1"||
  claims.aud!=="authenticated"||!uuid(claims.session_id))
  return reply(origin,401,{error:"Invalid management session"});
 const {data:{user},error:userError}=await staff.auth.getUser(token);
 if(userError||!user?.email_confirmed_at||user.id!==claims.sub)
  return reply(origin,401,{error:"Verified management account required"});
 const {data:live,error:liveError}=await staff.rpc("mednest_staff_session_live",{
  p_user_id:user.id,p_session_id:claims.session_id
 });
 if(liveError||!live)return reply(origin,401,{error:"Session not active"});
 const {data:member,error:memberError}=await staff.from("mednest_staff_members")
  .select("technical_role,status,email").eq("user_id",user.id).maybeSingle();
 if(memberError||!member||member.technical_role!=="chief_admin"||
   member.status!=="active"||member.email!==(user.email||"").trim().toLowerCase())
  return reply(origin,403,{error:"Chief Administrator only"});
 if(body.action==="mcqs.list"){
  const page=body.page??0;
  const bank=body.bank??"";
  const subject=body.subject??"";
  const q=body.q??"";
  if(typeof bank!=="string"||typeof subject!=="string"||typeof q!=="string"||
    !Number.isInteger(page)||page<0||page>500||
    (bank&&!ALLOWED.has(bank))||
    subject.length>100||q.length>120)
   return reply(origin,400,{error:"Invalid MCQ search"});
  let query=student.from("mcqs")
   .select("id,bank,subject,chapter,topic,question,source,current_revision_id",{count:"exact"})
   .in("bank",bank?[bank]:BANKS);
  if(subject)query=query.eq("subject",subject);
  if(q.trim()){
   const search=q.trim();
   if(/^\d+$/.test(search))query=query.eq("id",Number(search));
    else query=query.ilike("question","%"+search.replace(/[%_]/g,"\\$&")+"%");
  }
  const {data,count,error}=await query.order("id",{ascending:true})
   .range(page*25,page*25+24);
  if(error)return reply(origin,503,{error:"Question search temporarily unavailable"});
  return reply(origin,200,{questions:data||[],total:count||0,page,page_size:25});
 }
 if(body.action==="mcqs.drafts"){
  const {data,error}=await staff.from("mednest_mcq_edit_drafts")
   .select("id,source_mcq_id,source_bank,original_revision_id,version,state,updated_at")
   .eq("owner_user_id",user.id).eq("state","draft")
   .order("updated_at",{ascending:false}).limit(60);
  if(error)return reply(origin,503,{error:"Edit drafts unavailable"});
  return reply(origin,200,{drafts:data||[]});
 }
 const id=body.mcq_id;
 if(!Number.isSafeInteger(id)||id<=0)
  return reply(origin,400,{error:"Valid MCQ ID required"});
 let source;
 try{source=await getStudentMCQ(id)}catch{return reply(origin,503,{error:"Student MCQ source temporarily unavailable"})}
 if(!source||!ALLOWED.has(source.bank))
  return reply(origin,404,{error:"Question unavailable"});
 let baseline;
 try{baseline=originalFields(source)}catch{return reply(origin,503,{error:"Question source invalid"})}
 const {data:existing,error:draftError}=await staff.from("mednest_mcq_edit_drafts")
  .select("id,source_mcq_id,source_bank,original_revision_id,original_fields,edited_fields,syllabus_topic_id,state,version,updated_at")
  .eq("owner_user_id",user.id).eq("source_mcq_id",id).maybeSingle();
 if(draftError)return reply(origin,503,{error:"Edit draft lookup unavailable"});
 if(body.action==="mcqs.get"){
  return reply(origin,200,{
   source:{id:source.id,bank:source.bank,revision_id:source.current_revision_id,fields:baseline},
   draft:existing?.state==="draft"?existing:null,
   source_changed:!!existing&&existing.original_revision_id!==source.current_revision_id
  });
 }
 if(!Number.isSafeInteger(source.current_revision_id)||source.current_revision_id<=0)
  return reply(origin,503,{error:"Current revision unavailable"});
 if(body.expected_revision_id!==source.current_revision_id)
  return reply(origin,409,{error:"Published source revision changed; reload before proposing an edit"});
 if(!validateEdited(body.fields,source.bank))
  return reply(origin,400,{error:"Invalid MCQ edit fields"});
 const topic=body.syllabus_topic_id||null;
 // A selected canonical topic must match its approved live Subject/Chapter names.
 // No topic selection is allowed for provisional older MCQ labels, which remain review-only.
 if(topic!==null){
  const {data:t,error:te}=await staff.from("mednest_syllabus_nodes")
   .select("id,parent_id,kind,name,state").eq("id",topic).maybeSingle();
  if(te||!t||t.kind!=="topic"||t.state!=="active")
   return reply(origin,400,{error:"Select an approved active syllabus topic"});
  const {data:c,error:ce}=await staff.from("mednest_syllabus_nodes")
   .select("id,parent_id,kind,name,state").eq("id",t.parent_id).maybeSingle();
  const {data:sub,error:se}=c
   ?await staff.from("mednest_syllabus_nodes").select("id,kind,name,state").eq("id",c.parent_id).maybeSingle()
   :{data:null,error:true};
  const key=x=>String(x||"").normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
  if(ce||se||!c||!sub||c.kind!=="chapter"||sub.kind!=="subject"||
   c.state!=="active"||sub.state!=="active"||
   key(body.fields.subject)!==key(sub.name)||key(body.fields.chapter)!==key(c.name)||
   key(body.fields.topic)!==key(t.name))
   return reply(origin,400,{error:"Edited Subject, Chapter and Topic must match the chosen approved syllabus path"});
 }
 if(topic!==null&&!uuid(topic))
  return reply(origin,400,{error:"Approved syllabus topic ID invalid"});
 const expected=body.expected_version;
 if(!Number.isInteger(expected)||expected<0)
  return reply(origin,400,{error:"Draft version required"});
 if(existing&&existing.state==="draft"&&expected!==existing.version)
  return reply(origin,409,{error:"Draft was edited in another tab; reload to prevent overwriting changes"});
 if(existing&&existing.original_revision_id!==source.current_revision_id)
  return reply(origin,409,{error:"Existing draft belongs to a previous source revision"});
 if(existing&&existing.state==="discarded")
  return reply(origin,409,{error:"Archived edit draft must be reviewed before replacement"});
 try{
  const {data,error}=await staff.rpc("mednest_mcq_edit_save_draft",{
   p_actor:user.id,p_session:claims.session_id,p_mcq_id:id,p_bank:source.bank,
   p_revision:source.current_revision_id,p_original:baseline,p_edited:body.fields,
   p_topic:topic,p_expected_version:expected
  });
  if(error)return reply(origin,409,{error:"Draft conflict, invalid syllabus topic, or session expired"});
  return reply(origin,200,{saved:true,draft:data,published:false});
 }catch{return reply(origin,503,{error:"Draft save unavailable"})}
});