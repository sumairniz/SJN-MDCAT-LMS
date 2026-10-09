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
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid or expired session.' });
    
    req.user = user;
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });

    if (error) return res.status(400).json({ error: error.message });

    const user = { id: data.user.id, name, email, role: 'student' };
    res.json({ token: data.session?.access_token, user });
  } catch (e) {
    res.status(500).json({ error: 'Registration server error.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  try {
    // Native Supabase Auth Sign In
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Incorrect email or password.' });

    // Fetch user profile name from public.profiles table
    const { data: profile } = await supabase
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

    res.json({ token: data.session.access_token, user });
  } catch (e) {
    res.status(500).json({ error: 'Login server error.' });
  }
});

// LMS Student User Data & Interactions
app.get('/api/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: attempts } = await supabase.from('attempts').select('total, correct').eq('user_id', userId);
    const total = (attempts || []).reduce((acc, x) => acc + x.total, 0);
    const correct = (attempts || []).reduce((acc, x) => acc + x.correct, 0);
    const stats = { total, correct, tests: (attempts || []).length };

    const { data: bookmarksData } = await supabase.from('bookmarks').select('mcq_id').eq('user_id', userId).order('created_at', { ascending: false });
    const bookmarks = (bookmarksData || []).map(x => x.mcq_id);

    const user = { id: userId, name: profile?.name || req.user.user_metadata?.name || 'Student', email: req.user.email, role: profile?.role || 'student' };
    res.json({ user, stats, bookmarks });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

app.get('/api/history', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
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

    const { data, error } = await supabase.from('attempts').insert([{
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
    const userId = req.user.id;

    const { data: existing } = await supabase
      .from('bookmarks')
      .select('mcq_id')
      .eq('user_id', userId)
      .eq('mcq_id', mcqId)
      .maybeSingle();

    if (existing) {
      await supabase.from('bookmarks').delete().eq('user_id', userId).eq('mcq_id', mcqId);
      res.json({ bookmarked: false });
    } else {
      await supabase.from('bookmarks').insert([{ user_id: userId, mcq_id: mcqId }]);
      res.json({ bookmarked: true });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update bookmark.' });
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
