'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const resultJs = fs.readFileSync(path.join(root, 'public/sjn-phase4-results.js'), 'utf8');
const resultCss = fs.readFileSync(path.join(root, 'public/sjn-phase4-results.css'), 'utf8');
const examJs = fs.readFileSync(path.join(root, 'public/sjn-phase4-preview.js'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');

function getFn(source, name) {
  const match = source.match(new RegExp('function ' + name + '\\([^]*?\\n  \\}'));
  assert.ok(match, name + ' must be available for pure calculation tests');
  return vm.runInNewContext('(' + match[0] + ')');
}
const summarizeAttempt = getFn(resultJs, 'summarizeAttempt');
const accuracyBand = getFn(resultJs, 'accuracyBand');
const formatDuration = getFn(resultJs, 'formatDuration');
const q = (subject, chapter, topic, correctIndex) => ({subject,chapter,topic,correctIndex});

test('Stage 3A source parses and remains opt-in with no production navigation changes', () => {
  assert.doesNotThrow(() => new vm.Script(resultJs));
  assert.doesNotThrow(() => new vm.Script(examJs));
  assert.match(resultJs, /sjnPhase4Preview'\) !== '1'/);
  assert.match(dashboard, /sjn-phase4-results.css/);
  assert.match(dashboard, /sjn-phase4-results.js/);
  assert.match(examJs, /window\.SJNPhase4Results\.show\(snapshot, savePromise\)/);
  assert.match(examJs, /window\.finishQuiz\(\)/);
});

test('Correct/incorrect/skipped and accuracy use actual variable test sizes', () => {
  const data = [
    q('Biology','Cells','DNA',0), q('Biology','Cells','RNA',1),
    q('Chemistry','Gases','Gas laws',2), q('Physics','Waves','Sound',3),
    q('Biology','Cells','DNA',0)
  ];
  const s = summarizeAttempt(data,[0,0,null,3,undefined],93);
  assert.equal(s.total,5);
  assert.equal(s.correct,2);
  assert.equal(s.incorrect,1);
  assert.equal(s.skipped,2);
  assert.equal(s.accuracy,40);
  assert.equal(s.correct+s.incorrect+s.skipped,s.total);
  assert.equal(s.elapsedSeconds,93);
  assert.equal(s.groups.subjects.length,3);
  assert.equal(s.groups.chapters.length,3);
  assert.equal(s.groups.topics.length,4);
  const a = summarizeAttempt(data, [0,1,2,3,0], 0);
  assert.equal(a.correct,5);
  assert.equal(a.accuracy,100);
  const b = summarizeAttempt(data,[],1);
  assert.equal(b.skipped,5);
  assert.equal(b.accuracy,0);
  const c = summarizeAttempt([],[],0);
  assert.equal(c.total,0);
  assert.equal(c.accuracy,0);
  const fifty = Array.from({length:50},()=>q('Biology','Cells','DNA',0));
  const answers = Array(40).fill(0).concat(Array(7).fill(1),Array(3).fill(null));
  const e = summarizeAttempt(fifty,answers,932);
  assert.equal(e.correct,40);
  assert.equal(e.incorrect,7);
  assert.equal(e.skipped,3);
  assert.equal(e.accuracy,80);
});

test('Thresholds, time display and three insight levels match blueprint', () => {
  assert.equal(accuracyBand(0),'red');
  assert.equal(accuracyBand(49),'red');
  assert.equal(accuracyBand(50),'yellow');
  assert.equal(accuracyBand(79),'yellow');
  assert.equal(accuracyBand(80),'green');
  assert.equal(accuracyBand(100),'green');
  assert.equal(formatDuration(0),'0:00');
  assert.equal(formatDuration(932),'15:32');
  assert.equal(formatDuration(3661),'1:01:01');
  const s = summarizeAttempt([q('Biology','Cells','DNA',0),q('Biology','Cells','DNA',1)],[0,null],60);
  assert.equal(s.groups.subjects[0].accuracy,50);
  assert.equal(s.groups.chapters[0].accuracy,50);
  assert.equal(s.groups.topics[0].accuracy,50);
  assert.match(resultJs, /Subject-wise Performance/);
  assert.match(resultJs, /Chapter-wise Performance/);
  assert.match(resultJs, /Topic-wise Performance/);
});

test('Approved result hierarchy, textured ring, exact cards and responsive grids', () => {
  assert.match(resultJs, /Practice Test Completed!/);
  assert.match(resultJs, /Here is your performance summary report\./);
  assert.match(resultJs, /<span>ACCURACY<\/span>/);
  assert.match(resultJs, /sjn-results-rope-pattern/);
  assert.match(resultJs, /report\.correct \+ ' \/ ' \+ report\.total/);
  assert.match(resultJs, /id="sjn-results-correct"/);
  assert.match(resultJs, /id="sjn-results-incorrect"/);
  assert.match(resultJs, /id="sjn-results-skipped"/);
  assert.match(resultJs, /id="sjn-results-time"/);
  assert.match(resultJs, /id="sjn-results-insights"/);
  assert.match(resultCss, /sjn-results-stats \{ display: grid; grid-template-columns: repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(resultCss, /sjn-results-actions \{ display: grid; grid-template-columns: repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(resultCss, /sjn-results-stats,\.sjn-results-actions \{ grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(resultCss, /transform: rotate\(-90deg\)/);
});

test('Results do not falsely promise historical Review or Retake and use server-confirmed saving', () => {
  assert.match(resultJs, /id="sjn-results-review" disabled/);
  assert.match(resultJs, /id="sjn-results-retake" disabled/);
  assert.match(resultJs, /Review Answers and Retake Test will be available after secure question-level attempt history/);
  assert.match(resultJs, /outcome\.saved === true && outcome\.id/);
  assert.match(dashboard, /return \{ saved: true, id: saved\.id \};/);
  assert.match(dashboard, /return \{ saved: false \};/);
  assert.match(dashboard, /headers: \{ 'X-SJN-Expected-Student': expectedStudentId \}/);
  assert.doesNotMatch(resultJs, /localStorage|sessionStorage|fetch\(/);
  assert.match(examJs, /Date\.now\(\) - state\.startedAt/);
});
