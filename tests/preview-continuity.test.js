'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const landing = fs.readFileSync(path.join(root, 'public/landing.html'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'public/sjn-preview-auth-route.js'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'public/sjn-phase4-preview.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
function getRoute(search, destination) {
  const win = { location: { search } };
  vm.runInNewContext(helper, { window: win, URLSearchParams });
  return win.SJNPreviewAuthRoute.to(destination);
}
test('real guest-preview-login URL sequence preserves opt-in', () => {
  const entry = '?sjnPhase4Preview=1&utm_source=chatgpt.com';
  const firstRedirect = getRoute(entry, '/landing.html');
  assert.equal(firstRedirect, '/landing.html?sjnPhase4Preview=1');
  const search = firstRedirect.substring(firstRedirect.indexOf('?'));
  assert.equal(getRoute(search, '/index.html'), '/index.html?sjnPhase4Preview=1');
  // The source of the URL opt-in is always the current page, never a shared
  // credential, student account or localStorage.
  assert.equal(getRoute('?sjnPhase4Preview=1', '/landing.html'), '/landing.html?sjnPhase4Preview=1');
  assert.equal(getRoute('?sjnPhase4Preview=1', '/index.html'), '/index.html?sjnPhase4Preview=1');
});
test('non-preview URLs remain ordinary, no open redirect or extra query leakage', () => {
  for (const q of ['', '?sjnPhase4Preview=0', '?utm_source=chatgpt.com', '?sjnPhase4Preview=true']) {
    assert.equal(getRoute(q, '/index.html'), '/index.html');
    assert.equal(getRoute(q, '/landing.html'), '/landing.html');
  }
  assert.equal(getRoute('?sjnPhase4Preview=1&next=https://evil.invalid&access_token=private', '/index.html'),
    '/index.html?sjnPhase4Preview=1');
  assert.throws(() => getRoute('?sjnPhase4Preview=1', '//evil.invalid'), /Unexpected authentication route/);
});
test('every dashboard auth redirect, including cross-tab login/logout, uses shared routing', () => {
  assert.ok(index.includes('src="/sjn-preview-auth-route.js"'));
  assert.ok(landing.includes('src="/sjn-preview-auth-route.js"'));
  assert.ok(index.indexOf('src="/sjn-preview-auth-route.js"') < index.indexOf('let mcqQuestionBank ='));
  assert.ok(landing.indexOf('src="/sjn-preview-auth-route.js"') < landing.indexOf('const SJN_AUTH ='));
  const redirects = [...index.matchAll(/window\.location\.replace\((.+)\)/g)].map(match => match[1]);
  assert.equal(redirects.length, 14, 'Every redirect must be reviewed when adding an auth path');
  assert.ok(redirects.every(line => line.startsWith('SJNPreviewAuthRoute.to(')), 'Unexpected unguarded auth redirect');
  assert.match(index, /SJNPreviewAuthRoute\.to\(type === 'logout'/);
  assert.match(index, /SJNPreviewAuthRoute\.to\(event\.type === 'login'/);
  assert.match(landing, /dashboard: SJNPreviewAuthRoute\.to\('\/index\.html'\)/);
});
test('nonsecret preview status is preview-only on server and exposes DB identity', () => {
  assert.match(server, /process\.env\.VERCEL_ENV !== 'preview'/);
  assert.match(server, /from\('mcqs'\)\.select\('id', \{ head: true, count: 'exact' \}\)/);
  assert.match(preview, /\/api\/preview-status/);
  assert.match(preview, /s\.project !== 'aozknkrwafowsrehdwlr'/);
});
test('staging banners distinguish old exam flow from Phase 4 even on identical deploy', () => {
  assert.match(preview, /LEGACY EXAM MODE/);
  assert.match(preview, /PHASE 4 PREVIEW/);
});

test('legacy mode notices are staging-verified and never shown in production by default', () => {
  assert.match(preview, /fetch\('\/api\/preview-status'/);
  assert.match(preview, /response\.ok \? response\.json\(\) : null/);
  assert.match(preview, /info\.environment !== 'preview'/);
  assert.match(preview, /info\.project !== 'aozknkrwafowsrehdwlr'/);
});
