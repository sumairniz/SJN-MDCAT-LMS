'use strict';
const crypto=require('node:crypto');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encode=s=>encodeURIComponent(s).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
const h=(key,value)=>crypto.createHmac('sha256',key).update(value).digest();
function presignedGet(key,now=new Date()){
 const account=process.env.R2_ACCOUNT_ID, access=process.env.R2_ACCESS_KEY_ID,
   secret=process.env.R2_SECRET_ACCESS_KEY, bucket=process.env.R2_BUCKET_NAME;
 if(!account||!access||!secret||bucket!=='sjn-mednest-academy-resources')return null;
 if(!/^[a-f0-9]{32}$/i.test(account)||!/^[a-zA-Z0-9_-]{8,120}$/.test(access))return null;
 const host=account+'.r2.cloudflarestorage.com',date=now.toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
 const day=date.slice(0,8),scope=day+'/auto/s3/aws4_request';
 const uri='/'+encode(bucket)+'/'+String(key).split('/').map(encode).join('/');
 const fields={ 'X-Amz-Algorithm':'AWS4-HMAC-SHA256','X-Amz-Credential':access+'/'+scope,
  'X-Amz-Date':date,'X-Amz-Expires':'180','X-Amz-SignedHeaders':'host' };
 const query=Object.keys(fields).sort().map(k=>encode(k)+'='+encode(fields[k])).join('&');
 const canonical=['GET',uri,query,'host:'+host+'\n','host','UNSIGNED-PAYLOAD'].join('\n');
 const hash=crypto.createHash('sha256').update(canonical).digest('hex');
 const string=['AWS4-HMAC-SHA256',date,scope,hash].join('\n');
 const signature=crypto.createHmac('sha256',
   h(h(h(h('AWS4'+secret,day),'auto'),'s3'),'aws4_request')).update(string).digest('hex');
 return 'https://'+host+uri+'?'+query+'&X-Amz-Signature='+signature;
}
function registerAcademyResourceRoutes(app,auth){
 app.get('/api/academy-resources',auth,async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  try{
   const [f,d]=await Promise.all([
    req.db.from('academy_resource_folders').select('id,parent_id,name,sort_order').eq('is_published',true).order('sort_order').order('name').limit(1000),
    req.db.from('academy_resource_files').select('id,folder_id,title,description,mime_type,size_bytes,sort_order').eq('is_published',true).order('sort_order').order('title').limit(1000)
   ]);
   if(f.error||d.error)throw new Error('Metadata unavailable');
   const allowed=new Set((f.data||[]).map(x=>x.id));
   res.json({folders:f.data||[],files:(d.data||[]).filter(x=>!x.folder_id||allowed.has(x.folder_id))});
  }catch(_){res.status(503).json({error:'Academy Resources are temporarily unavailable.'});}
 });
 app.get('/api/academy-resources/:id/open',auth,async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  if(!UUID.test(req.params.id))return res.status(400).json({error:'Invalid resource.'});
  try{
   const {data,error}=await req.db.from('academy_resource_files')
     .select('id,folder_id,title,object_key,mime_type,is_published')
     .eq('id',req.params.id).eq('is_published',true).maybeSingle();
   if(error)throw error;
   if(!data)return res.status(404).json({error:'Resource not found.'});
   if(data.folder_id){
    const q=await req.db.from('academy_resource_folders').select('id')
      .eq('id',data.folder_id).eq('is_published',true).maybeSingle();
    if(q.error)throw q.error;
    if(!q.data)return res.status(404).json({error:'Resource not found.'});
   }
   // Published metadata is the allowlist; restrict bucket keys to safe PDF-only paths.
   // Folder structure is user-defined, so a fixed pdfs/ prefix is not required.
   if(data.mime_type!=='application/pdf'||
      !/^(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9._-]*\.pdf$/.test(data.object_key))
    return res.status(404).json({error:'Unsupported resource.'});
   const url=presignedGet(data.object_key);
   if(!url)return res.status(503).json({error:'Secure PDF access is not configured yet.'});
   return res.json({url,expiresInSeconds:180,title:data.title});
  }catch(_){return res.status(503).json({error:'Unable to open the resource.'});}
 });
}
module.exports={registerAcademyResourceRoutes,presignedGet};
