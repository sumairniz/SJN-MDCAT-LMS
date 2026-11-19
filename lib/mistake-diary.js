'use strict';
// Owner-approved Mistake Diary: immutable verified incorrect history + student-owned annotations.
// Routes are independent of grading/History/Analytics and work only under per-request RLS auth.
const categories=new Set(['information','conceptual','silly','retention']);
const statuses=new Set(['need-review','in-progress','mastered']);
const sourceKinds=new Set(['banks','courses','papers']);
const MAX_PAGE=1000;
function validId(x){const s=String(x??'');const n=Number(s);return /^[1-9][0-9]{0,14}$/.test(s)&&Number.isSafeInteger(n)?n:null;}
function validGroup(kind,query){
 if(!sourceKinds.has(kind))return null;
 const out={};
 if(kind==='banks'){
  if(typeof query.subject!=='string'||!query.subject.trim()||query.subject.length>90)return null;
  if(typeof query.chapter!=='string'||query.chapter.length>160)return null;
  out.subject=query.subject;out.chapter=query.chapter;
 }else if(kind==='courses'){
  out.courseTestId=validId(query.courseTestId);if(out.courseTestId===null)return null;
 }else{
  if(typeof query.paperTitle!=='string'||!query.paperTitle.trim()||query.paperTitle.length>180)return null;
  out.paperTitle=query.paperTitle;
 }
 return out;
}
function registerMistakeDiaryRoutes(app,auth){
 app.get('/api/mistake-diary/catalog',auth,async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  try{
   const {data,error}=await req.db.rpc('sjn_mistake_diary_catalog');
   if(error||!data||!data.totals||!Array.isArray(data.groups))throw error||Error('Incomplete verified mistake diary');
   res.json({userId:req.user.id,totals:data.totals,groups:data.groups});
  }catch(e){
   console.error('Mistake Diary catalog unavailable:',e?.code||e?.message);
   res.status(503).json({error:'Could not load your Mistake Diary. Please retry.'});
  }
 });
 app.get('/api/mistake-diary/entries',auth,async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  const kind=String(req.query.source||'');
  const group=validGroup(kind,req.query);
  const page=Number(req.query.page||1),limit=20;
  const category=String(req.query.category||'all'),status=String(req.query.status||'all');
  if(!group||!Number.isInteger(page)||page<1||page>MAX_PAGE||
    (category!=='all'&&!categories.has(category))||
    (status!=='all'&&!statuses.has(status)))
    return res.status(400).json({error:'Invalid mistake filters.'});
  try{
   let q=req.db.from('sjn_mistake_diary_entries')
    .select('mcq_id,revision_id,selected_index,correct_index,attempt_id,position,attempt_title,last_wrong_at,wrong_count,source_kind,bank,subject,chapter,topic,source,question,options_json,explanation,mnemonic,course_test_id,course_title,test_title,paper_title,category,learning_note,review_status,annotation_updated_at',{count:'exact'})
    .eq('user_id',req.user.id).eq('source_kind',kind);
   if(kind==='banks')q=q.eq('subject',group.subject).eq('chapter',group.chapter);
   else if(kind==='courses')q=q.eq('course_test_id',group.courseTestId);
   else q=q.eq('paper_title',group.paperTitle);
   if(category==='all'){}else q=q.eq('category',category);
   if(status!=='all')q=q.eq('review_status',status);
   const {data,error,count}=await q.order('last_wrong_at',{ascending:false})
    .order('mcq_id',{ascending:true}).range((page-1)*limit,page*limit-1);
   if(error||!Array.isArray(data)||!Number.isInteger(count))throw error||Error('Invalid Diary result');
   if(data.some(x=>!Array.isArray(x.options_json)||x.options_json.length!==4||
       !Number.isInteger(x.correct_index)||x.correct_index<0||x.correct_index>3||
       !Number.isInteger(x.selected_index)||x.selected_index<0||x.selected_index>3||
       x.correct_index===x.selected_index))
     throw Error('Incorrect answer integrity validation failed');
   res.json({userId:req.user.id,entries:data,total:count,page,pageSize:limit});
  }catch(e){
   console.error('Mistake Diary entries unavailable:',e?.code||e?.message);
   res.status(503).json({error:'Could not verify your saved mistakes. Please retry.'});
  }
 });
 app.put('/api/mistake-diary/annotations/:mcqId',auth,async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  const id=validId(req.params.mcqId),body=req.body;
  if(id===null||!body||typeof body!=='object'||Array.isArray(body)||
    !Object.keys(body).every(k=>['category','learningNote','reviewStatus'].includes(k))||
    Object.keys(body).length!==3||
    (body.category!==null&&!categories.has(body.category))||
    typeof body.learningNote!=='string'||body.learningNote.length>1200||
    !statuses.has(body.reviewStatus))
    return res.status(400).json({error:'Invalid mistake diary entry.'});
  const uid=req.user.id;
  try{
   // The query's own RLS and immutable incorrect-history predicate deny
   // forged question IDs; never allow writes based on client-provided user IDs.
   const {data:proof,error:proofError}=await req.db.from('sjn_mistake_diary_entries')
     .select('mcq_id').eq('user_id',uid).eq('mcq_id',id).maybeSingle();
   if(proofError)throw proofError;
   if(!proof)return res.status(404).json({error:'Saved mistake not found.'});
   const payload={user_id:uid,mcq_id:id,category:body.category,
     learning_note:body.learningNote,review_status:body.reviewStatus};
   const {data,error}=await req.db.from('sjn_mistake_annotations')
    .upsert(payload,{onConflict:'user_id,mcq_id'})
    .select('mcq_id,category,learning_note,review_status,updated_at')
    .single();
   if(error||!data||Number(data.mcq_id)!==id)throw error||Error('Annotation not confirmed');
   res.json({userId:uid,saved:true,annotation:data});
  }catch(e){
   console.error('Mistake Diary annotation not saved:',e?.code||e?.message);
   res.status(503).json({error:'Could not save your Mistake Diary changes. Please retry.'});
  }
 });
}
module.exports={registerMistakeDiaryRoutes,validId,validGroup,categories,statuses};
