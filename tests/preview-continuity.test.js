'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const landing = fs.readFileSync(path.join(root, 'public/landing.html'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'public/sjn-phase4-preview.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
test('Phase 4 preview opt-in survives guest redirect and login without forwarding arbitrary URLs', () => {
  assert.match(index, /window\.location\.replace\('\/landing\.html' \+ \(new URLSearchParams\(window\.location\.search\)\.get\('sjnPhase4Preview'\) === '1'/);
  assert.match(landing, /dashboard: '\/index\.html' \+ \(new URLSearchParams\(window\.location\.search\)\.get\('sjnPhase4Preview'\) === '1'/);
  assert.doesNotMatch(index, /window\.location\.replace\('\/landing\.html'\)/);
});
test('read-only technical status is staging only and refuses unverified database target', () => {
  assert.match(server, /process\.env\.VERCEL_ENV !== 'preview'/);
  assert.match(server, /from\('mcqs'\)\.select\('id', \{ head: true, count: 'exact' \}\)/);
  assert.match(preview, /\/api\/preview-status/);
  assert.match(preview, /s\.project !== 'aozknkrwafowsrehdwlr'/);
  assert.match(preview, /WRONG DATABASE/);
});
