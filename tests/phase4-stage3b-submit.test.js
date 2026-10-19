'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validatePracticeSubmission } = require('../lib/practice-submission');
const root = path.join(__dirname, '..');
const dashboard = fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const server = fs.readFileSync(path.join(root,'server.js'),'utf8');
const results = fs.readFileSync(path.join(root,'public/sjn-phase4-results.js'),'utf8');
const preview = fs.readFileSync(path.join(root,'public/sjn-phase4-preview.js'),'utf8');
const key = 'f4221f8c-1122-4f6c-8a22-a65b5a0d1255';
const example = {
  submissionKey: key, items: [
    { mcqId: 1, revisionId: 9, selectedIndex: 0 },
    { mcqId: 2, revisionId: 10, selectedIndex: null }
  ], title: 'Biology Test', mode: 'timed', subject: 'Biology',
  elapsedSeconds: 123, selection: { chapters: ['Biological Molecules'] }
};

test('Stage 3B validates exact answer identity, skipped question and account-safe request', () => {
  assert.deepEqual(validatePracticeSubmission(example), example);
  assert.equal(validatePracticeSubmission({...example,correct:99}),null);
  assert.equal(validatePracticeSubmission({...example,items:[example.items[0],example.items[0]]}),null);
  assert.equal(validatePracticeSubmission({...example,items:[]}),null);
  assert.equal(validatePracticeSubmission({...example,items:[...example.items,{mcqId:3,revisionId:3,selectedIndex:4}]}),null);
  assert.equal(validatePracticeSubmission({...example,items:[{mcqId:3,revisionId:3,selectedIndex:-1}]}),null);
  assert.equal(validatePracticeSubmission({...example,items:[{mcqId:3,revisionId:3,selectedIndex:undefined}]}),null);
  assert.equal(validatePracticeSubmission({...example,submissionKey:'invalid'}),null);
  assert.equal(validatePracticeSubmission({...example,elapsedSeconds:-1}),null);
  assert.equal(validatePracticeSubmission({...example,selection:[]}),null);
  assert.equal(validatePracticeSubmission({...example,mode:'mock'}),null);
});

test('stage 3B normal and Phase 4 flows both use the server-graded route exactly once', () => {
  assert.match(server, /app.post\('\/api\/practice\/submit', auth/);
  assert.match(server, /revisionId: row.current_revision_id/);
  assert.match(dashboard, /api\('\/practice\/submit'/);
  assert.doesNotMatch(dashboard, /api\('\/attempts',\s*\{/);
  assert.match(dashboard, /currentSubmissionKey = window.crypto\?\.randomUUID/);
  assert.match(dashboard, /savedAttemptOutcome = null/);
  assert.match(dashboard, /selectedIndex: userAnswers\[i\]/);
  assert.match(preview, /window\.finishQuiz\(\{ elapsedSeconds: snapshot\.elapsedSeconds \}\)/);
  assert.match(results, /outcome\.correct/);
  assert.match(results, /\$\('sjn-results-insights'\)\.hidden = true/);
  assert.doesNotMatch(results, /Saved with database-verified/);
});
