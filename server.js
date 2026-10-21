const path = require('path');
const crypto = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { validatePracticeSubmission } = require('./lib/practice-submission');
const { validateDraft, UUID: DRAFT_UUID } = require('./lib/practice-drafts');
const dotenv = require('dotenv');

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Official Supabase Client Initialization
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
// Auth state must never be shared between different student requests.
const CLIENT_OPTIONS = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
};
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, CLIENT_OPTIONS);

function newAuthClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, CLIENT_OPTIONS);
}

function studentClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...CLIENT_OPTIONS,
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
}

// A session is valid for exactly 24 hours after a successful login.
// Both HttpOnly cookies must accompany protected API calls. The timebox is
// HMAC-authenticated with the rotating, secret Supabase refresh token; there
// is no browser-accessible token and no additional signing secret required.
// V2 cookie names intentionally prevent old 30-day sessions from being reused.
const REFRESH_COOKIE = 'sjn_refresh_v2';
const SESSION_COOKIE = 'sjn_session_v2';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
    sameSite: 'lax',
    path: '/api'
  };
}
function readCookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const divider = part.indexOf('=');
    if (divider < 0 || part.slice(0, divider).trim() !== name) continue;
    try { return decodeURIComponent(part.slice(divider + 1).trim()); }
    catch { return null; }
  }
  return null;
}
function sessionSignature(refreshToken, expiresAt, userId) {
  return crypto.createHmac('sha256', refreshToken)
    .update(String(expiresAt) + ':' + userId).digest('hex');
}
function readSession(req) {
  const refreshToken = readCookie(req, REFRESH_COOKIE);
  const value = readCookie(req, SESSION_COOKIE);
  if (!refreshToken || !value) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const expiresAt = Number(parts[0]);
  const userId = parts[1];
  const signature = parts[2];
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() ||
      !userId || !/^[0-9a-f]{64}$/.test(signature)) return null;
  const expected = sessionSignature(refreshToken, expiresAt, userId);
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
    return null;
  }
  return { refreshToken, expiresAt, userId };
}
function issueSession(res, refreshToken, userId, expiresAt = Date.now() + SESSION_DURATION_MS) {
  if (!refreshToken || !userId) return null;
  const maxAge = Math.max(0, expiresAt - Date.now());
  const signature = sessionSignature(refreshToken, expiresAt, userId);
  res.cookie(REFRESH_COOKIE, refreshToken, { ...sessionCookieOptions(), maxAge });
  res.cookie(SESSION_COOKIE, [expiresAt, userId, signature].join('.'), {
    ...sessionCookieOptions(), maxAge
  });
  // Remove the provisional 30-day cookie from older staging previews.
  res.clearCookie('sjn_refresh', { ...sessionCookieOptions(), path: '/api/auth' });
  return expiresAt;
}
function clearSession(res) {
  res.clearCookie(REFRESH_COOKIE, sessionCookieOptions());
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  res.clearCookie('sjn_refresh', { ...sessionCookieOptions(), path: '/api/auth' });
}

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const CONTENT = path.join(ROOT, 'content');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Middleware to verify Supabase Auth tokens passed from the frontend
async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  const session = readSession(req);
  if (!session) {
    // An old tab's response must never erase a new login's cookies.
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  try {
    // Verify token directly using Supabase Auth
    const db = studentClient(token);
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user || user.id !== session.userId || Date.now() >= session.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }
    
    req.user = user;
    req.db = db;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Authentication verification failed.' });
  }
}

function admin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(503).json({ error: 'ADMIN_TOKEN is not configured.' });
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: 'Developer content access denied.' });
  next();
}

function publicMcq(row) {
  return {
    id: row.id, bank: row.bank, subject: row.subject, chapter: row.chapter || '', topic: row.topic || '',
    question: row.question, options: row.options_json, correctIndex: row.correct_index,
    revisionId: row.current_revision_id ?? null,
    explanation: row.explanation || '', mnemonic: row.mnemonic || '', source: row.source || ''
  };
}

// System Endpoints
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'SJN MDCAT LMS Pro - Supabase Cloud' }));

// TEMP-P4-007: preview-only nonsecret deployment and live MCQ count diagnostics.
app.get('/api/preview-status', async (req, res) => {
  if (process.env.VERCEL_ENV !== 'preview') return res.status(404).end();
  res.set('Cache-Control', 'no-store');
  try {
    const { count, error } = await supabase.from('mcqs').select('id', { head: true, count: 'exact' });
    if (error || !Number.isSafeInteger(count)) throw new Error('MCQ count unavailable');
    const sha = String(process.env.VERCEL_GIT_COMMIT_SHA || '');
    const project = new URL(SUPABASE_URL).hostname.match(/^([a-z0-9-]+)\.supabase\.co$/)?.[1] || null;
    res.json({ environment: 'preview', commit: /^[a-f0-9]{40}$/.test(sha) ? sha : null,
      project, mcqCount: count });
  } catch (_) { res.status(503).json({ error: 'Preview verification unavailable.' }); }
});

// Fetch content from persistent Supabase tables
app.get('/api/content', async (req, res) => {
  try {
    const [{ data: mcqs, error: mcqError }, { data: courses }, { data: pastPapers }, { data: resources }] = await Promise.all([
      supabase.from('mcqs').select('*').order('id'),
      supabase.from('courses').select('*').order('id'),
      supabase.from('past_papers').select('*').order('year', { ascending: false }),
      supabase.from('resources').select('*').order('id', { ascending: false })
    ]);

    // Do not convert a Supabase error to an apparently valid empty bank,
    // or return published questions without the current grading revision.
    if (mcqError || !Array.isArray(mcqs) ||
        mcqs.some(q => !Number.isSafeInteger(Number(q.current_revision_id)) ||
                       Number(q.current_revision_id) < 1)) {
      throw new Error('Published question bank or revision lookup failed');
    }
    res.set('Cache-Control', 'no-store');
    res.json({
      banks: [...new Set(mcqs.map(q => q.bank))],
      mcqs: mcqs.map(publicMcq),
      courses: (courses || []).map(r => ({ ...r, chapters: r.chapters_json || [] })),
      pastPapers: (pastPapers || []).map(r => ({ ...r, mcqIds: r.mcq_ids_json || [] })),
      resources: resources || []
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch content from database.' });
  }
});

// --- SUPABASE AUTHENTICATION ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  
  if (!name || !email || password.length < 8) {
    return res.status(400).json({ error: 'Name, valid email and password of at least 8 characters are required.' });
  }

  try {
    // Native Supabase Auth Sign Up
    const { data, error } = await newAuthClient().auth.signUp({
      email,
      password,
      options: { data: { name } }
    });

    if (error) return res.status(400).json({ error: error.message });

    const user = { id: data.user.id, name, email, role: 'student' };
    const expiresAt = data.session?.refresh_token
      ? issueSession(res, data.session.refresh_token, data.user.id) : null;
    res.json({
      token: data.session?.access_token || null,
      expiresAt,
      requiresEmailConfirmation: !data.session,
      user
    });
  } catch (e) {
    res.status(500).json({ error: 'Registration server error.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  try {
    // Native Supabase Auth Sign In
    const { data, error } = await newAuthClient().auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Incorrect email or password.' });

    // Fetch user profile name from public.profiles table
    const { data: profile } = await studentClient(data.session.access_token)
      .from('profiles')
      .select('name, role')
      .eq('id', data.user.id)
      .single();

    const user = { 
      id: data.user.id, 
      name: profile?.name || data.user.user_metadata?.name || 'Student', 
      email: data.user.email, 
      role: profile?.role || 'student' 
    };

    const expiresAt = issueSession(res, data.session.refresh_token, data.user.id);
    res.json({ token: data.session.access_token, user, expiresAt });
  } catch (e) {
    res.status(500).json({ error: 'Login server error.' });
  }
});

// Read-only signed-cookie check for tabs resuming after another login/logout.
// Protected APIs still require a valid Supabase access token and user match.
app.get('/api/auth/session', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const session = readSession(req);
  if (!session) return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, userId: session.userId, expiresAt: session.expiresAt });
});

// A refresh rotates the Supabase token but never extends the 24-hour deadline.
app.post('/api/auth/refresh', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const session = readSession(req);
  if (!session) {
    // Stale refresh replies must not delete newer cookies in another tab.
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
  try {
    const { data, error } = await newAuthClient().auth.refreshSession({
      refresh_token: session.refreshToken
    });
    if (error || !data?.session?.access_token || !data.session.refresh_token ||
        !data.user || data.user.id !== session.userId ||
        Date.now() >= session.expiresAt) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    issueSession(res, data.session.refresh_token, session.userId, session.expiresAt);
    const payload={token:data.session.access_token,userId:session.userId,expiresAt:session.expiresAt};
    if(req.query.bootstrap==='1') {
      // Auth already verified the refresh token and user; the DB uses student RLS.
      Object.assign(payload,await studentOverview(studentClient(data.session.access_token),data.user));
    }
    return res.json(payload);
  } catch (e) {
    return res.status(503).json({ error: 'Could not renew the session. Please try again.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.set('Cache-Control', 'no-store');
  clearSession(res);
  res.json({ ok: true });
});

// Parallel, RLS-scoped student summary used by /me and one-request startup.
async function studentOverview(db, authUser) {
  const uid = authUser.id;
  const [p,a,b] = await Promise.all([
    db.from('profiles').select('name, role').eq('id',uid).single(),
    db.from('attempts').select('total, correct').eq('user_id',uid),
    db.from('bookmarks').select('mcq_id').eq('user_id',uid).order('created_at',{ascending:false})
  ]);
  if (p.error && p.error.code !== 'PGRST116') throw p.error;
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  const attempts=a.data||[];
  return {
    user:{id:uid,name:p.data?.name||authUser.user_metadata?.name||'Student',email:authUser.email,role:p.data?.role||'student'},
    stats:{total:attempts.reduce((n,x)=>n+x.total,0),
           correct:attempts.reduce((n,x)=>n+x.correct,0),tests:attempts.length},
    bookmarks:(b.data||[]).map(x=>x.mcq_id)
  };
}

// LMS Student User Data & Interactions
app.get('/api/me', auth, async (req, res) => {
  try { res.json(await studentOverview(req.db,req.user)); }
  catch(e) { res.status(500).json({error:'Failed to fetch user data.'}); }
});

app.get('/api/history', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { data, error } = await req.db
      .from('attempts')
      .select('id, title, total, correct, accuracy, mode, subject, selection_json, created_at, details_version')
      .eq('user_id', req.user.id)
      .order('id', { ascending: false });

    if (error) throw error;
    res.json({ userId: req.user.id, attempts: data || [] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load test history.' });
  }
});

// Stage 3B historical result and question review: authenticated, per-student
// read-only endpoint. A foreign or missing attempt returns the same 404.
app.get('/api/history/:attemptId', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const rawId = String(req.params.attemptId || '');
  const id = Number(rawId);
  if (!/^[1-9][0-9]{0,14}$/.test(rawId) || !Number.isSafeInteger(id))
    return res.status(400).json({ error: 'Invalid test identifier.' });
  const studentId = req.user.id;
  try {
    const { data: attempt, error: parentError } = await req.db
      .from('attempts')
      .select('id, title, total, correct, accuracy, mode, subject, selection_json, created_at, details_version, elapsed_seconds')
      .eq('user_id', studentId).eq('id', id).maybeSingle();
    if (parentError) throw parentError;
    if (!attempt) return res.status(404).json({ error: 'Test not found.' });
    const basic = {
      id: attempt.id, title: attempt.title || 'Practice Test',
      total: attempt.total, correct: attempt.correct,
      accuracy: attempt.accuracy, mode: attempt.mode,
      subject: attempt.subject, selection: attempt.selection_json || {},
      date: attempt.created_at, elapsedSeconds: attempt.elapsed_seconds,
      detailsVersion: attempt.details_version
    };
    // The original summary-only attempts never stored selected questions.
    // Preserve their score; never reconstruct fake answers or allow Retake.
    if (attempt.details_version !== 1) {
      return res.json({
        userId: studentId, attempt: basic, items: [],
        reviewAvailable: false, retakeAvailable: false
      });
    }
    const { data: rows, error: itemError } = await req.db
      .from('attempt_items')
      .select('position, mcq_id, mcq_revision_id, selected_index, is_correct')
      .eq('user_id', studentId).eq('attempt_id', id)
      .order('position', { ascending: true });
    if (itemError) throw itemError;
    if (!Array.isArray(rows) || rows.length !== attempt.total || !rows.length ||
        rows.some((r, i) => r.position !== i + 1)) throw new Error('Incomplete historical attempt');
    const revisionIds = rows.map(r => r.mcq_revision_id);
    const { data: revisions, error: revisionError } = await req.db
      .from('mcq_revisions')
      .select('id, mcq_id, bank, subject, chapter, topic, source, question, options_json, correct_index, explanation, mnemonic')
      .in('id', revisionIds);
    if (revisionError) throw revisionError;
    const byRevisionId = new Map((revisions || []).map(row => [String(row.id), row]));
    const items = rows.map(row => {
      const rev = byRevisionId.get(String(row.mcq_revision_id));
      if (!rev || Number(rev.mcq_id) !== Number(row.mcq_id) ||
          !Array.isArray(rev.options_json) || rev.options_json.length !== 4 ||
          !Number.isInteger(rev.correct_index) ||
          rev.correct_index < 0 || rev.correct_index > 3 ||
          (row.selected_index !== null &&
           (!Number.isInteger(row.selected_index) || row.selected_index < 0 || row.selected_index > 3)) ||
          row.is_correct !== (row.selected_index !== null && row.selected_index === rev.correct_index))
        throw new Error('Historical question revision integrity check failed');
      return {
        position: row.position, mcqId: row.mcq_id,
        revisionId: row.mcq_revision_id, selectedIndex: row.selected_index,
        isCorrect: row.is_correct, bank: rev.bank, subject: rev.subject,
        chapter: rev.chapter || '', topic: rev.topic || '', source: rev.source || '',
        question: rev.question, options: rev.options_json, correctIndex: rev.correct_index,
        explanation: rev.explanation || '', mnemonic: rev.mnemonic || ''
      };
    });
    const correct = items.filter(item => item.isCorrect).length;
    if (correct !== attempt.correct) throw new Error('Historical score integrity mismatch');
    const ids = items.map(row => row.mcqId);
    const { data: marks, error: markError } = await req.db
      .from('bookmarks').select('mcq_id')
      .eq('user_id', studentId).in('mcq_id', ids);
    if (markError) throw markError;
    const marked = new Set((marks || []).map(row => String(row.mcq_id)));
    res.json({
      userId: studentId, attempt: basic,
      items: items.map(item => ({ ...item, marked: marked.has(String(item.mcqId)) })),
      reviewAvailable: true, retakeAvailable: true
    });
  } catch (error) {
    console.error('Historical attempt read failed:', error?.code || error?.message || 'unknown');
    res.status(503).json({ error: 'Unable to verify the saved test details. Please retry.' });
  }
});


const draftColumns='id, user_id, submission_key, title, mode, subject, selection_json, items_json, answers_json, checked_json, current_index, elapsed_seconds, remaining_seconds, version, created_at, updated_at';
// Drafts are separate from graded attempts. All reads/writes require current
// cookie + bearer identity AND Supabase student RLS; no service-role bypass.
app.get('/api/practice/drafts', auth, async (req,res)=>{
  res.set('Cache-Control','no-store');
  try {
    const {data,error}=await req.db.from('practice_drafts').select(draftColumns)
      .eq('user_id',req.user.id).order('updated_at',{ascending:false});
    if(error)throw error;
    res.json({userId:req.user.id,drafts:(data||[]).map(row=>({
      id:row.id,title:row.title,mode:row.mode,subject:row.subject,
      selection:row.selection_json,total:row.items_json.length,
      answered:row.answers_json.filter(x=>x!==null).length,
      date:row.updated_at,version:row.version
    }))});
  } catch(e){console.error('Draft list failed:',e?.code||e?.message);res.status(503).json({error:'Unable to load unfinished tests.'});}
});
app.get('/api/practice/drafts/:id',auth,async(req,res)=>{
  res.set('Cache-Control','no-store');
  if(!DRAFT_UUID.test(req.params.id))return res.status(400).json({error:'Invalid draft identifier.'});
  try{
    const {data,error}=await req.db.from('practice_drafts').select(draftColumns)
      .eq('user_id',req.user.id).eq('id',req.params.id).maybeSingle();
    if(error)throw error;
    if(!data)return res.status(404).json({error:'Unfinished test not found.'});
    // A saved submission must never become a resumable draft.
    const {data:completed,error:ce}=await req.db.from('attempts').select('id')
      .eq('user_id',req.user.id).eq('submission_key',data.submission_key).limit(1);
    if(ce)throw ce;
    if(completed?.length)return res.status(409).json({error:'This test was already submitted. See completed Test History.'});
    res.json({userId:req.user.id,draft:{
      id:data.id,submissionKey:data.submission_key,title:data.title,
      subject:data.subject,mode:data.mode,selection:data.selection_json,
      items:data.items_json,answers:data.answers_json,checked:data.checked_json,
      currentIndex:data.current_index,elapsedSeconds:data.elapsed_seconds,
      remainingSeconds:data.remaining_seconds,version:data.version
    }});
  }catch(e){console.error('Draft read failed:',e?.code||e?.message);res.status(503).json({error:'Unable to restore your saved test.'});}
});
app.put('/api/practice/drafts',auth,async(req,res)=>{
  res.set('Cache-Control','no-store');
  if(req.get('X-SJN-Expected-Student')!==req.user.id)
    return res.status(409).json({error:'Active student changed. Reload before saving.'});
  const draft=validateDraft(req.body);
  if(!draft)return res.status(400).json({error:'Invalid draft. Nothing was saved.'});
  try{
    const {data:completed,error:ce}=await req.db.from('attempts').select('id')
      .eq('user_id',req.user.id).eq('submission_key',draft.submissionKey).limit(1);
    if(ce)throw ce;
    if(completed?.length)return res.status(409).json({error:'Already submitted; cannot save an unfinished copy.'});
    // Validate each draft item against its published question's CURRENT
    // immutable revision. Authenticated students may read public.mcqs, but
    // mcq_revisions SELECT is intentionally limited to their completed history.
    // Using revisions here incorrectly rejected new Topic Drill questions.
    // Never broaden revision RLS or trust question/revision pairs from the client.
    const {data:published,error:pe}=await req.db.from('mcqs')
      .select('id,current_revision_id').in('id',draft.items.map(x=>x.mcqId));
    if(pe)throw pe;
    const revisions=new Map((published||[]).map(row=>[Number(row.id),Number(row.current_revision_id)]));
    if(revisions.size!==draft.items.length||
        draft.items.some(x=>revisions.get(x.mcqId)!==x.revisionId))
      return res.status(400).json({error:'Question revisions could not be verified.'});
    const row={user_id:req.user.id,submission_key:draft.submissionKey,
      title:draft.title,mode:draft.mode,subject:draft.subject,
      selection_json:draft.selection,items_json:draft.items,
      answers_json:draft.answers,checked_json:draft.checked,
      current_index:draft.currentIndex,elapsed_seconds:draft.elapsedSeconds,
      remaining_seconds:draft.remainingSeconds};
    if(draft.version===0){
      const {data,error}=await req.db.from('practice_drafts')
        .insert({id:draft.id,...row,version:1}).select('id,version').single();
      if(error){
        if(error.code==='23505')return res.status(409).json({error:'Draft already exists. Reload its latest version.'});
        throw error;
      }
      return res.json({saved:true,id:data.id,version:data.version});
    }
    // Version compare-and-swap: another tab cannot silently overwrite.
    const {data,error}=await req.db.from('practice_drafts')
      .update({...row,version:draft.version+1,updated_at:new Date().toISOString()})
      .eq('id',draft.id).eq('user_id',req.user.id)
      .eq('submission_key',draft.submissionKey).eq('version',draft.version)
      .select('id,version').maybeSingle();
    if(error)throw error;
    if(!data)return res.status(409).json({error:'Draft changed in another session. Reload before saving.'});
    res.json({saved:true,id:data.id,version:data.version});
  }catch(e){console.error('Draft save failed:',e?.code||e?.message);res.status(503).json({error:'Could not save your unfinished test. You are still in the exam.'});}
});

// Stage 3B-2: PostgreSQL scores the immutable current revisions and saves
// both the summary and ordered question history as one atomic transaction.
app.post('/api/practice/submit', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const expectedStudentId = req.get('X-SJN-Expected-Student');
  if (!expectedStudentId || expectedStudentId !== req.user.id)
    return res.status(409).json({ error: 'Active student changed. Reload before submitting.' });
  const payload = validatePracticeSubmission(req.body);
  if (!payload) return res.status(400).json({ error: 'Invalid practice submission. Nothing was saved.' });
  try {
    const { data, error } = await req.db.rpc('sjn_submit_practice_attempt', {
      p_submission_key: payload.submissionKey,
      p_items: payload.items,
      p_title: payload.title,
      p_mode: payload.mode,
      p_subject: payload.subject,
      p_selection: payload.selection,
      p_elapsed_seconds: payload.elapsedSeconds
    });
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Submission key conflict. Check Test History before trying again.' });
      if (error.code === '28000') return res.status(401).json({ error: 'Session expired. Please sign in again.' });
      if (error.code === '22023') return res.status(400).json({ error: 'Invalid or unavailable practice questions.' });
      throw error;
    }
    const saved = Array.isArray(data) ? data[0] : data;
    const id = Number(saved?.attempt_id), total = Number(saved?.total_questions);
    const correct = Number(saved?.correct_answers), incorrect = Number(saved?.incorrect_answers),
      skipped = Number(saved?.skipped_answers), accuracy = Number(saved?.accuracy_percent);
    if (!Number.isSafeInteger(id) || id < 1 || total !== payload.items.length ||
      ![correct,incorrect,skipped].every(n => Number.isSafeInteger(n) && n >= 0) ||
      correct + incorrect + skipped !== total || !Number.isFinite(accuracy) ||
      accuracy < 0 || accuracy > 100) throw new Error('Unexpected trusted grading response');
    // Best effort draft cleanup only after authoritative atomic grading.
    // A failure does not invalidate a completed score; read paths deny
    // resuming drafts whose submission key is already recorded.
    void req.db.from('practice_drafts').delete().eq('user_id',req.user.id)
      .eq('submission_key',payload.submissionKey).then(({error})=>{
        if(error) console.warn('Submitted draft cleanup pending:',error.code);
      }).catch(()=>{});
    res.json({ saved: true, id, total, correct, incorrect, skipped, accuracy,
      alreadySaved: saved.already_saved === true });
  } catch (e) {
    console.error('Verified practice submit failed:', e?.code || e?.message || 'unknown');
    res.status(503).json({ error: 'Saving could not be verified. Check Test History before retrying.' });
  }
});

// Permanent compatibility tombstone: obsolete client-score submissions cannot
// write history. Older cached tabs receive a clear upgrade instruction rather
// than an SPA HTML 200 response from the catch-all route.
// New Tutor and Timed practice tests use /api/practice/submit exclusively.
app.post('/api/attempts', (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.status(410).json({
    error: 'This score-only submission method has been retired. Reload the LMS to submit your test securely.'
  });
});

app.post('/api/bookmarks/toggle', auth, async (req, res) => {
  try {
    const mcqId = Number(req.body.mcqId);
    if (!Number.isSafeInteger(mcqId) || mcqId < 1) {
      return res.status(400).json({ error: 'A valid MCQ ID is required.' });
    }
    const userId = req.user.id;

    const { data: existing, error: lookupError } = await req.db
      .from('bookmarks')
      .select('mcq_id')
      .eq('user_id', userId)
      .eq('mcq_id', mcqId)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (existing) {
      const { error: writeError } = await req.db.from('bookmarks').delete().eq('user_id', userId).eq('mcq_id', mcqId);
      if (writeError) throw writeError;
      res.json({ bookmarked: false });
    } else {
      const { error: writeError } = await req.db.from('bookmarks').insert([{ user_id: userId, mcq_id: mcqId }]);
      if (writeError) throw writeError;
      res.json({ bookmarked: true });
    }
  } catch (e) {
    res.status(e.code === '23503' ? 409 : 500).json({
      error: e.code === '23503'
        ? 'This question must be published to the database before it can be marked.'
        : 'Failed to update marked question.'
    });
  }
});

// AI Tutor Service
app.post('/api/ai/tutor', auth, async (req, res) => {
  if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI Tutor is not configured yet. Add GEMINI_API_KEY to the server environment.' });
  const prompt = String(req.body.prompt || '').trim();
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  try {
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `You are SJN MDCAT LMS AI Tutor. Explain clearly at MDCAT level. Do not invent textbook citations. Student question: ${prompt}` }] }] })
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data?.error?.message || 'AI service error.' });
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n') || 'No answer returned.';
    res.json({ answer: text });
  } catch (e) {
    res.status(502).json({ error: 'Could not reach the AI service.' });
  }
});

// Developer Synchronization Endpoint
app.post('/api/dev/sync', admin, (req, res) => {
  try {
    const { syncContent } = require('./scripts/sync-content');
    syncContent();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC, 'landing.html'));
});

// TEMP-P4-001: On the dedicated Vercel branch preview, Phase 4 is the default.
// Server-side normalization remains reliable even when login navigation drops
// the opt-in query parameter. The standard production route is unchanged.
const PHASE4_STAGING_HOST = 'sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app';
app.get('/index.html', (req, res, next) => {
  if (process.env.VERCEL_ENV !== 'preview' ||
      String(req.hostname || '').toLowerCase() !== PHASE4_STAGING_HOST ||
      req.query.sjnPhase4Preview === '1') return next();
  res.set('Cache-Control', 'private, no-store');
  return res.redirect(302, '/index.html?sjnPhase4Preview=1');
});

app.use(express.static(PUBLIC));
app.use('/resources', express.static(path.join(CONTENT, 'resources')));


app.use((req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

if (require.main === module) {
  app.listen(PORT, () => console.log(`SJN MDCAT LMS Pro running on http://localhost:${PORT}`));
}

module.exports = app;
