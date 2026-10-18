const path = require('path');
const crypto = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { validatePracticeSubmission } = require('./lib/practice-submission');
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
    const [{ data: mcqs }, { data: courses }, { data: pastPapers }, { data: resources }] = await Promise.all([
      supabase.from('mcqs').select('*').order('id'),
      supabase.from('courses').select('*').order('id'),
      supabase.from('past_papers').select('*').order('year', { ascending: false }),
      supabase.from('resources').select('*').order('id', { ascending: false })
    ]);

    res.json({
      banks: ['Past Papers Question Bank'],
      mcqs: (mcqs || []).map(publicMcq),
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
      .select('id, title, total, correct, accuracy, mode, subject, selection_json, created_at')
      .eq('user_id', req.user.id)
      .order('id', { ascending: false });

    if (error) throw error;
    res.json({ userId: req.user.id, attempts: data || [] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load test history.' });
  }
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
    res.json({ saved: true, id, total, correct, incorrect, skipped, accuracy,
      alreadySaved: saved.already_saved === true });
  } catch (e) {
    console.error('Verified practice submit failed:', e?.code || e?.message || 'unknown');
    res.status(503).json({ error: 'Saving could not be verified. Check Test History before retrying.' });
  }
});

app.post('/api/attempts', auth, async (req, res) => {
  // Prevent a stale tab from saving Student A's test into Student B's new session.
  const expectedStudentId = req.get('X-SJN-Expected-Student');
  if (expectedStudentId && expectedStudentId !== req.user.id) {
    return res.status(409).json({ error: 'Active student changed. Reload before saving.' });
  }
  try {
    const b = req.body || {};
    const total = Math.max(0, Number(b.total || 0));
    const correct = Math.max(0, Math.min(total, Number(b.correct || 0)));
    const accuracy = total ? (correct / total) * 100 : 0;

    const { data, error } = await req.db.from('attempts').insert([{
      user_id: req.user.id,
      title: String(b.title || 'Practice Test'),
      total,
      correct,
      accuracy,
      mode: String(b.mode || 'tutor'),
      subject: String(b.subject || 'Mixed'),
      selection_json: b.selection || {}
    }]).select('id').single();

    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save test attempt.' });
  }
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
