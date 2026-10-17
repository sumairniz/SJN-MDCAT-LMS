'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'public/index.html'),'utf8');
const js = fs.readFileSync(path.join(root, 'public/sjn-phase4-preview.js'),'utf8');
const css = fs.readFileSync(path.join(root, 'public/sjn-phase4-preview.css'),'utf8');

test('Stage 2: SPA preview syntax, opt-in gate and source integration', () => {
  assert.doesNotThrow(() => new vm.Script(js, { filename:'sjn-phase4-preview.js' }));
  assert.match(page, /href="\/sjn-phase4-preview\.css"/);
  assert.match(page, /src="\/sjn-phase4-preview\.js"/);
  assert.match(js, /sjnPhase4Preview'\) !== '1'/);
  assert.match(js, /const origLaunch = window\.launchGeneratedQuiz/);
  assert.match(js, /origLaunch\.apply\(this, args\)/);
  assert.match(js, /history\[fn\]/);
  assert.match(js, /\/quiz\/session\?sjnPhase4Preview=1/);
  assert.match(page, /id="sjn-student-header"/);
  assert.match(page, /id="sjn-student-footer"/);
  assert.match(page, /id="sjn-workspace-main"/);
});

test('Stage 2: all exam styles are scoped and responsive; no custom background redesign', () => {
  assert.match(css, /body\.sjn-phase4-exam-active #sidebar-nav/);
  assert.match(css, /\.sjn-exam-layout\.nav-hidden/);
  assert.match(css, /@media\(max-width:767px\)/);
  assert.match(js, /sjn-exam-source-row/);
  assert.match(js, /sjn-exam-chapter/);
  assert.match(js, /sjn-exam-letter/);
  assert.match(css, /background: #101013;/);
  assert.doesNotMatch(css, /url\(/);
});

test('Stage 2: no false saving or leaking Timed Practice answer feedback', () => {
  assert.match(js, /Save & Exit is not yet available in this staged preview/);
  assert.match(js, /isTutor && state\.checked\[i\]/);
  assert.match(js, /const checked = isTutor && state\.checked\[currentMcqIndex\]/);
  assert.match(js, /if \(isTutor\) state\.checked\[currentMcqIndex\] = true/);
  assert.match(js, /window\.finishQuiz\(\)/);
  assert.match(js, /Review Unanswered/);
  assert.match(js, /Submit Anyway/);
  assert.match(js, /window\.addEventListener\('beforeunload'/);
});
