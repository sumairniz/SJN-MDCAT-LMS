const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'data', 'sjn-lms.db');
const input = path.join(ROOT, 'content', 'mcqs.json');
if (!fs.existsSync(input)) {
  console.error('Missing content/mcqs.json. Copy content/mcqs.example.json to content/mcqs.json and fill it with your MCQs.');
  process.exit(1);
}
const db = new Database(DB);
db.exec(`CREATE TABLE IF NOT EXISTS mcqs (id INTEGER PRIMARY KEY AUTOINCREMENT,bank TEXT NOT NULL DEFAULT 'Past Papers Question Bank',subject TEXT NOT NULL,chapter TEXT,topic TEXT,question TEXT NOT NULL,options_json TEXT NOT NULL,correct_index INTEGER NOT NULL,explanation TEXT,mnemonic TEXT,source TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
const items = JSON.parse(fs.readFileSync(input, 'utf8'));
if (!Array.isArray(items)) throw new Error('content/mcqs.json must contain an array.');
const insert = db.prepare(`INSERT INTO mcqs(bank,subject,chapter,topic,question,options_json,correct_index,explanation,mnemonic,source) VALUES(?,?,?,?,?,?,?,?,?,?)`);
let count = 0;
const tx = db.transaction(() => {
  for (const q of items) {
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) throw new Error(`Invalid MCQ: ${q.question || '(missing question)'}`);
    const ci = Number(q.correctIndex);
    if (![0,1,2,3].includes(ci)) throw new Error(`Invalid correctIndex for: ${q.question}`);
    insert.run('Past Papers Question Bank', q.subject || 'Other', q.chapter || '', q.topic || '', q.question, JSON.stringify(q.options), ci, q.explanation || '', q.mnemonic || '', q.source || '');
    count++;
  }
});
tx();
db.close();
console.log(`Imported ${count} MCQs into Past Papers Question Bank.`);
