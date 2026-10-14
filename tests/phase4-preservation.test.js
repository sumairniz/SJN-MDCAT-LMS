'use strict';

// Phase 4 preservation gate.  The original 74 Biology MCQs are still
// embedded in public/index.html. This test must run before any future
// question-bank extraction, migration, or separate quiz-page rollout.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dashboard = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

function originalBankLiteral() {
  const match = dashboard.match(/(?:let|const)\s+mcqQuestionBank\s*=\s*(\[[\s\S]*?\n\s{4}\]);/);
  assert.ok(match, 'Original inline question bank must remain available until a tested replacement exists');
  return match[1];
}

function fnv1a64(text) {
  let hash = 0xcbf29ce484222325n;
  for (let i = 0; i < text.length; i++) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}

test('Phase 4: original 74 Biology questions remain byte-identical to the accepted baseline', () => {
  const literal = originalBankLiteral();
  assert.equal(fnv1a64(literal), 'a2e57e72716394e8',
    'Original question bank has changed; review every original MCQ against the accepted baseline before proceeding');

  const questions = vm.runInNewContext('(' + literal + ')', Object.create(null), { timeout: 1000 });
  assert.equal(questions.length, 74);
  const ids = new Set();
  for (const question of questions) {
    assert.equal(question.subject, 'Biology');
    assert.equal(question.bank, 'Past Papers Question Bank');
    assert.ok(Number.isSafeInteger(question.id));
    assert.ok(!ids.has(question.id), 'Original question ID must be unique');
    ids.add(question.id);
    assert.equal(question.options.length, 4);
    assert.ok(question.options.every(x => typeof x === 'string' && x.trim()), 'Each answer text must exist');
    assert.ok(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < 4);
    for (const field of ['question', 'chapter', 'topic', 'source', 'explanation', 'mnemonic']) {
      assert.ok(typeof question[field] === 'string' && question[field].trim(), field + ' must remain available');
    }
  }
  for (let id = 1; id <= 74; id++) assert.ok(ids.has(id), 'Original MCQ ID missing: ' + id);
});

test('Phase 4: empty asynchronous Supabase MCQ list cannot overwrite the original questions', () => {
  assert.match(dashboard, /Array\.isArray\(data\.mcqs\)\s*&&\s*data\.mcqs\.length\s*>\s*0\)\s*mcqQuestionBank\s*=\s*data\.mcqs/,
    'The LMS must preserve the original bank when the staging mcqs table is empty');
});

test('Phase 4: existing finished attempts remain server-owned and student-scoped', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(server, /app\.get\('\/api\/history',\s*auth/);
  assert.match(server, /\.from\('attempts'\)[\s\S]{0,230}\.eq\('user_id',\s*req\.user\.id\)/);
  assert.match(server, /app\.post\('\/api\/attempts',\s*auth/);
  assert.match(server, /user_id:\s*req\.user\.id/);
  assert.match(server, /X-SJN-Expected-Student/);
});
