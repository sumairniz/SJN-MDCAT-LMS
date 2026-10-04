const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'data', 'sjn-lms.db');
const seedPath = path.join(ROOT, 'content', 'seed.json');

function syncContent() {
  fs.mkdirSync(path.dirname(DB), { recursive: true });
  const db = new Database(DB);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,description TEXT,chapters_json TEXT DEFAULT '[]',body TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS past_papers (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,year TEXT,description TEXT,mcq_ids_json TEXT DEFAULT '[]',pdf_url TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,description TEXT,type TEXT NOT NULL DEFAULT 'pdf',url TEXT NOT NULL,category TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS mcqs (id INTEGER PRIMARY KEY AUTOINCREMENT,bank TEXT NOT NULL DEFAULT 'Past Papers Question Bank',subject TEXT NOT NULL,chapter TEXT,topic TEXT,question TEXT NOT NULL,options_json TEXT NOT NULL,correct_index INTEGER NOT NULL,explanation TEXT,mnemonic TEXT,source TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM courses').run();
    db.prepare('DELETE FROM past_papers').run();
    db.prepare('DELETE FROM resources').run();
    const course = db.prepare('INSERT INTO courses(title,description,chapters_json,body) VALUES(?,?,?,?)');
    for (const c of seed.courses || []) course.run(c.title, c.description || c.desc || '', JSON.stringify(c.chapters || []), c.body || '');
    const paper = db.prepare('INSERT INTO past_papers(title,year,description,mcq_ids_json,pdf_url) VALUES(?,?,?,?,?)');
    for (const p of seed.pastPapers || []) paper.run(p.title, String(p.year || ''), p.description || p.desc || '', JSON.stringify(p.mcqIds || []), p.pdfUrl || '');
    const resource = db.prepare('INSERT INTO resources(title,description,type,url,category) VALUES(?,?,?,?,?)');
    for (const r of seed.resources || []) resource.run(r.title, r.description || r.desc || '', r.type || 'pdf', r.url, r.category || 'Study Material');
  });
  tx();
  db.close();
  console.log('Content synced from content/seed.json');
}

if (require.main === module) syncContent();
module.exports = { syncContent };
