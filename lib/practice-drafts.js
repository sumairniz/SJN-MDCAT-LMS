'use strict';

// Stage A: durable manual exam drafts. This validator runs before any database
// write; scores and answer keys are never accepted from the browser.
const { MAX_QUESTIONS } = require('./practice-submission');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeText = (x, n) => typeof x === 'string' && x.trim().length > 0 &&
  x.trim().length <= n && !/[\u0000-\u001f]/.test(x);
function validateDraft(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const allowed=['id','submissionKey','title','mode','subject','selection','items',
    'answers','checked','currentIndex','elapsedSeconds','remainingSeconds','version'];
  if (Object.keys(body).some(key=>!allowed.includes(key))) return null;
  if (typeof body.id!=='string' || !UUID.test(body.id) ||
      typeof body.submissionKey!=='string' || !UUID.test(body.submissionKey) ||
      !safeText(body.title,120) || !safeText(body.subject,100) ||
      !['timed','tutor'].includes(body.mode)) return null;
  if (!body.selection || typeof body.selection!=='object' || Array.isArray(body.selection) ||
      JSON.stringify(body.selection).length>8192) return null;
  if (!Array.isArray(body.items) || !body.items.length ||
      body.items.length>MAX_QUESTIONS ||
      !Array.isArray(body.answers) || body.answers.length!==body.items.length ||
      !Array.isArray(body.checked) || body.checked.length!==body.items.length) return null;
  const ids=new Set(),revisions=new Set();
  const items=[];
  for (let i=0;i<body.items.length;i++) {
    const item=body.items[i];
    if (!item || typeof item!=='object' || Array.isArray(item) ||
        Object.keys(item).sort().join(',')!=='mcqId,revisionId' ||
        !Number.isSafeInteger(item.mcqId) || item.mcqId<1 ||
        !Number.isSafeInteger(item.revisionId) || item.revisionId<1 ||
        ids.has(item.mcqId) || revisions.has(item.revisionId)) return null;
    const answer=body.answers[i],checked=body.checked[i];
    if (!(answer===null || (Number.isInteger(answer) && answer>=0 && answer<=3)) ||
        typeof checked!=='boolean' || (body.mode==='timed' && checked) ||
        (body.mode==='tutor' && checked!==(answer!==null))) return null;
    ids.add(item.mcqId);revisions.add(item.revisionId);
    items.push({mcqId:item.mcqId,revisionId:item.revisionId});
  }
  if (!Number.isSafeInteger(body.currentIndex) || body.currentIndex<0 ||
      body.currentIndex>=items.length ||
      !Number.isSafeInteger(body.version) || body.version<0 ||
      !Number.isSafeInteger(body.elapsedSeconds) || body.elapsedSeconds<0 ||
      body.elapsedSeconds>86400) return null;
  if (body.mode==='timed') {
    if (!Number.isSafeInteger(body.remainingSeconds) ||
        body.remainingSeconds<0 || body.remainingSeconds>items.length*60) return null;
  } else if (body.remainingSeconds!==null) return null;
  return {id:body.id.toLowerCase(),submissionKey:body.submissionKey.toLowerCase(),
    title:body.title.trim(),subject:body.subject.trim(),mode:body.mode,
    selection:body.selection,items,answers:body.answers.slice(),
    checked:body.checked.slice(),currentIndex:body.currentIndex,
    elapsedSeconds:body.elapsedSeconds,remainingSeconds:body.remainingSeconds,
    version:body.version};
}
module.exports={validateDraft,UUID};
