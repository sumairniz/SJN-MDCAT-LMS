'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rootDir = path.join(__dirname,'..');
const html = fs.readFileSync(path.join(rootDir,'public','index.html'),'utf8');
const js = fs.readFileSync(path.join(rootDir,'public','sjn-pastpapers.js'),'utf8');
const css = fs.readFileSync(path.join(rootDir,'public','sjn-pastpapers.css'),'utf8');

function openBrowser() {
  const listeners = {};
  const root = {
    innerHTML: '',
    addEventListener(name,cb) { listeners[name] = cb; },
    contains(node) { return node?.inRoot === true; }
  };
  const window = {};
  vm.runInNewContext(js,{
    window,
    document: {getElementById(id) { return id==='sjn-pastpapers-root'?root:null; }}
  });
  return {root,window,click(region) {
    const node = {inRoot:true,dataset:{sjnPaperRegion:region}};
    listeners.click({target:{closest(selector) {return selector==='[data-sjn-paper-region]'?node:null;}}});
  },back() {
    const node={inRoot:true};
    listeners.click({target:{closest(selector){return selector==='[data-sjn-paper-back]'?node:null;}}});
  }};
}

test('Past Papers page has no giant parent panel or old two-column viewer, sidebar kept',()=>{
  const sect=html.slice(html.indexOf('<section id="module-pastpapers"'),html.indexOf('<section id="module-resources"'));
  assert.match(sect,/id="module-pastpapers"/);
  assert.match(sect,/id="sjn-pastpapers-root"/);
  assert.match(sect,/Past Papers/);
  assert.doesNotMatch(sect,/Interface preview|sjn-pp-stage-badge/);
  assert.doesNotMatch(sect,/bg-sjn-card rounded-2xl|lg:grid-cols|pastpapers-container|pastpaper-viewer|iframe|\.pdf/i);
  assert.match(html,/onclick="switchModule\('pastpapers'\)" id="tab-pastpapers"/);
  assert.match(html,/src="\/sjn-pastpapers\.js"/);
  assert.match(html,/href="\/sjn-pastpapers\.css"/);
  assert.match(html,/function renderPastPapersModule\(\) \{\s+window\.SJNPastPapers\?\.render\(\);/);
  assert.match(html,/window\.renderPastPapersModule = renderPastPapersModule;/);
});

test('Five accessible province/region categories and back navigation work without database',()=>{
  const ui=openBrowser();
  for(const name of ['Sindh','Punjab','KPK','Balochistan','Federal'])
    assert.match(ui.root.innerHTML,new RegExp('Browse '+name+' Past Papers'));
  assert.equal((ui.root.innerHTML.match(/data-sjn-paper-region=/g)||[]).length,5);
  ui.click('sindh');
  assert.match(ui.root.innerHTML,/Sindh MDCAT 2025/);
  assert.match(ui.root.innerHTML,/data-sjn-paper-back/);
  assert.match(ui.root.innerHTML,/0 published papers/);
  assert.match(ui.root.innerHTML,/Start Paper/);
  assert.match(ui.root.innerHTML,/disabled title=/);
  assert.match(ui.root.innerHTML,/Not published/);
  assert.doesNotMatch(ui.root.innerHTML,/sjn-pp-year-heading|Example paper layout|Layout preview/);
  assert.match(ui.root.innerHTML,/sjn-pp-paper-grid/);
  assert.match(ui.root.innerHTML,/No question papers have been uploaded yet/);
  ui.back();
  assert.match(ui.root.innerHTML,/Select a category/);
  assert.match(ui.root.innerHTML,/No question papers have been uploaded yet/);
  assert.doesNotMatch(ui.root.innerHTML,/Categories are ready for your review/);
  ui.click('federal');
  assert.match(ui.root.innerHTML,/Federal MDCAT 2025/);
});

test('Preview only: never launch a quiz, load a PDF, claim a test published, or modify data',()=>{
  assert.doesNotMatch(js,/launchGeneratedQuiz|finishQuiz|practicePastPaper|fetch\(|localStorage|sessionStorage|iframe|pdfUrl|new XMLHttpRequest/);
  assert.match(js,/Questions not uploaded/);
  assert.match(js,/Sample paper card/);
  assert.match(js,/No question papers have been uploaded yet/);
  assert.doesNotMatch(js,/Preview only —|Categories are ready for your review|sjn-pp-year-heading/);
  assert.match(js,/Object\.freeze\(\{ render \}\)/);
  assert.match(css,/#module-pastpapers \.sjn-pp-region-grid/);
  assert.match(css,/@media\(max-width:650px\)/);
  assert.match(css,/:focus-visible/);
  assert.match(html,/window\.practicePastPaper = function\(id, source\) \{\s+wizardQuestionFiltersActive = false;/);
});

test('Approved layout refinements keep compact year-wise paper cards and balanced spacing',()=>{
  assert.match(css,/\.sjn-pp-paper-grid \{[^}]*grid-template-columns:repeat\(auto-fill,minmax\(min\(100%,340px\),1fr\)\)/);
  assert.match(css,/\.sjn-pp-paper-card \{[^}]*padding:16px;/);
  assert.doesNotMatch(css,/max-width:630px|\.sjn-pp-year-heading|\.sjn-pp-stage-badge/);
  assert.match(css,/\.sjn-pp-heading \{ margin: 0 0 18px; padding: 3px 0 16px;/);
  assert.match(css,/\.sjn-pp-crumb \{[^}]*margin:-2px 0 12px;/);
  assert.match(css,/@media\(max-width:650px\)/);
  assert.match(js,/disabled title="No verified paper questions available yet"/);
});
