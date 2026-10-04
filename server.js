const path = require('path');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Supabase Credentials
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const CONTENT = path.join(ROOT, 'content');
const DATA = process.env.VERCEL ? '/tmp' : path.join(ROOT, 'data');
try {
  fs.mkdirSync(DATA, { recursive: true });
  fs.mkdirSync(path.join(CONTENT, 'resources'), { recursive: true });
} catch (err) {
  console.log('Serverless environment: skipped folder creation');
}

const db = new Database(path.join(DATA, 'sjn-lms.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS mcqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank TEXT NOT NULL DEFAULT 'Past Papers Question Bank',
  subject TEXT NOT NULL,
  chapter TEXT,
  topic TEXT,
  question TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  mnemonic TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  chapters_json TEXT DEFAULT '[]',
  body TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS past_papers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year TEXT,
  description TEXT,
  mcq_ids_json TEXT DEFAULT '[]',
  pdf_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'pdf',
  url TEXT NOT NULL,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT,
  total INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  mode TEXT,
  subject TEXT,
  selection_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id TEXT NOT NULL,
  mcq_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, mcq_id),
  FOREIGN KEY(mcq_id) REFERENCES mcqs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_mcqs_subject ON mcqs(subject);
CREATE INDEX IF NOT EXISTS idx_mcqs_chapter ON mcqs(chapter);
CREATE INDEX IF NOT EXISTS idx_mcqs_topic ON mcqs(topic);
`);

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(PUBLIC));
app.use('/resources', express.static(path.join(CONTENT, 'resources')));

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
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
    question: row.question, options: JSON.parse(row.options_json), correctIndex: row.correct_index,
    explanation: row.explanation || '', mnemonic: row.mnemonic || '', source: row.source || ''
  };
}

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'SJN MDCAT LMS Pro' }));

app.get('/api/content', (req, res) => {
  const mcqs = db.prepare('SELECT * FROM mcqs ORDER BY id').all().map(publicMcq);
  const courses = db.prepare('SELECT * FROM courses ORDER BY id').all().map(r => ({ ...r, chapters: JSON.parse(r.chapters_json || '[]') }));
  const pastPapers = db.prepare('SELECT * FROM past_papers ORDER BY year DESC, id DESC').all().map(r => ({ ...r, mcqIds: JSON.parse(r.mcq_ids_json || '[]') }));
  const resources = db.prepare('SELECT * FROM resources ORDER BY id DESC').all();
  res.json({ banks: ['Past Papers Question Bank'], mcqs, courses, pastPapers, resources });
});

app.get('/api/questions', (req, res) => {
  const rows = db.prepare('SELECT * FROM mcqs ORDER BY id').all();
  res.json(rows.map(publicMcq));
});

// --- UPDATED SUPABASE REGISTRATION ---
app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  
  if (!name || !email || password.length < 8) return res.status(400).json({ error: 'Name, valid email and password of at least 8 characters are required.' });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ error: 'Database is not connected.' });

  try {
    // 1. Check if user already exists in Supabase
    const checkUser = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const existingUsers = await checkUser.json();
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // 2. Hash password and insert into Supabase
    const hash = await bcrypt.hash(password, 12);
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ name, email, password: hash, role: 'student' })
    });

    if (!insertRes.ok) throw new Error('Database insertion failed');
    
    const insertedData = await insertRes.json();
    const dbUser = insertedData[0];

    // 3. Create Login Token
    const user = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// --- UPDATED SUPABASE LOGIN ---
app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ error: 'Database is not connected.' });

  try {
    // 1. Fetch user from Supabase
    const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    
    const users = await fetchRes.json();
    const user = users && users.length > 0 ? users[0] : null;

    // 2. Verify Password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    // 3. Create Login Token
    const safe = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(safe, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: safe });
  } catch (e) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

// --- UPDATED GET USER INFO ---
app.get('/api/me', auth, (req, res) => {
  const user = req.user; // Use user from JWT token
  const stats = db.prepare('SELECT COALESCE(SUM(total),0) total, COALESCE(SUM(correct),0) correct, COUNT(*) tests FROM attempts WHERE user_id=?').get(user.id);
  const bookmarks = db.prepare('SELECT mcq_id FROM bookmarks WHERE user_id=? ORDER BY created_at DESC').all(user.id).map(x => x.mcq_id);
  res.json({ user, stats, bookmarks });
});

app.get('/api/history', auth, (req, res) => {
  const rows = db.prepare('SELECT id,title,total,correct,accuracy,mode,subject,selection_json,created_at FROM attempts WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  res.json(rows);
});

app.post('/api/attempts', auth, (req, res) => {
  const b = req.body || {};
  const total = Math.max(0, Number(b.total || 0));
  const correct = Math.max(0, Math.min(total, Number(b.correct || 0)));
  const accuracy = total ? (correct / total) * 100 : 0;
  const info = db.prepare(`INSERT INTO attempts(user_id,title,total,correct,accuracy,mode,subject,selection_json) VALUES(?,?,?,?,?,?,?,?)`)
    .run(req.user.id, String(b.title || 'Practice Test'), total, correct, accuracy, String(b.mode || 'tutor'), String(b.subject || 'Mixed'), JSON.stringify(b.selection || {}));
  res.json({ id: info.lastInsertRowid });
});

app.post('/api/bookmarks/toggle', auth, (req, res) => {
  const mcqId = Number(req.body.mcqId);
  const exists = db.prepare('SELECT 1 FROM bookmarks WHERE user_id=? AND mcq_id=?').get(req.user.id, mcqId);
  if (exists) db.prepare('DELETE FROM bookmarks WHERE user_id=? AND mcq_id=?').run(req.user.id, mcqId);
  else db.prepare('INSERT OR IGNORE INTO bookmarks(user_id,mcq_id) VALUES(?,?)').run(req.user.id, mcqId);
  res.json({ bookmarked: !exists });
});

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

app.post('/api/dev/sync', admin, (req, res) => {
  try {
    const { syncContent } = require('./scripts/sync-content');
    syncContent();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use((req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

if (require.main === module) {
  app.listen(PORT, () => console.log(`SJN MDCAT LMS Pro running on http://localhost:${PORT}`));
}

module.exports = app;
