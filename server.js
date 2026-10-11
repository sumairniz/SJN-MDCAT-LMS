const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
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

// Refresh tokens stay in an HttpOnly cookie, never in JavaScript or localStorage.
// Each session refresh uses an isolated Supabase client; rotation is respected.
const REFRESH_COOKIE = 'sjn_refresh';
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
    sameSite: 'lax',
    path: '/api/auth'
  };
}
function setRefreshCookie(res, refreshToken) {
  if (refreshToken) res.cookie(REFRESH_COOKIE, refreshToken, {
    ...refreshCookieOptions(), maxAge: REFRESH_MAX_AGE
  });
}
function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
}
function readRefreshCookie(req) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const divider = part.indexOf('=');
    if (divider < 0 || part.slice(0, divider).trim() !== REFRESH_COOKIE) continue;
    try { return decodeURIComponent(part.slice(divider + 1).trim()); }
    catch { return null; }
  }
  return null;
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
  
  try {
    // Verify token directly using Supabase Auth
    const db = studentClient(token);
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid or expired session.' });
    
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
    explanation: row.explanation || '', mnemonic: row.mnemonic || '', source: row.source || ''
  };
}

// System Endpoints
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'SJN MDCAT LMS Pro - Supabase Cloud' }));

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
    setRefreshCookie(res, data.session?.refresh_token);
    res.json({
      token: data.session?.access_token || null,
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

    setRefreshCookie(res, data.session.refresh_token);
    res.json({ token: data.session.access_token, user });
  } catch (e) {
    res.status(500).json({ error: 'Login server error.' });
  }
});

// Rotation is handled server-side, so the browser never stores a refresh token.
app.post('/api/auth/refresh', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const refreshToken = readRefreshCookie(req);
  if (!refreshToken) return res.status(401).json({ error: 'Please sign in to continue.' });
  try {
    const { data, error } = await newAuthClient().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session?.access_token || !data.session.refresh_token) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    setRefreshCookie(res, data.session.refresh_token);
    return res.json({ token: data.session.access_token });
  } catch (e) {
    return res.status(503).json({ error: 'Could not renew the session. Please try again.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.set('Cache-Control', 'no-store');
  clearRefreshCookie(res);
  res.json({ ok: true });
});

// LMS Student User Data & Interactions
app.get('/api/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error: profileError } = await req.db.from('profiles').select('name, role').eq('id', userId).single();
    if (profileError && profileError.code !== 'PGRST116') throw profileError;
    const { data: attempts, error: attemptsError } = await req.db.from('attempts').select('total, correct').eq('user_id', userId);
    if (attemptsError) throw attemptsError;
    const total = (attempts || []).reduce((acc, x) => acc + x.total, 0);
    const correct = (attempts || []).reduce((acc, x) => acc + x.correct, 0);
    const stats = { total, correct, tests: (attempts || []).length };

    const { data: bookmarksData, error: bookmarksError } = await req.db.from('bookmarks').select('mcq_id').eq('user_id', userId).order('created_at', { ascending: false });
    if (bookmarksError) throw bookmarksError;
    const bookmarks = (bookmarksData || []).map(x => x.mcq_id);

    const user = { id: userId, name: profile?.name || req.user.user_metadata?.name || 'Student', email: req.user.email, role: profile?.role || 'student' };
    res.json({ user, stats, bookmarks });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

app.get('/api/history', auth, async (req, res) => {
  try {
    const { data, error } = await req.db
      .from('attempts')
      .select('id, title, total, correct, accuracy, mode, subject, selection_json, created_at')
      .eq('user_id', req.user.id)
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load test history.' });
  }
});

app.post('/api/attempts', auth, async (req, res) => {
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

app.use(express.static(PUBLIC));
app.use('/resources', express.static(path.join(CONTENT, 'resources')));


app.use((req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

if (require.main === module) {
  app.listen(PORT, () => console.log(`SJN MDCAT LMS Pro running on http://localhost:${PORT}`));
}

module.exports = app;
