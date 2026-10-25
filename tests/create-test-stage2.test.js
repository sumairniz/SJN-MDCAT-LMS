'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

function functionSource(name) {
  const marker = '    function ' + name + '(';
  const start = src.indexOf(marker);
  assert.ok(start >= 0, 'Missing function: ' + name);
  const next = src.indexOf('\n    function ', start + marker.length);
  assert.ok(next > start, 'Missing function boundary for ' + name);
  return src.slice(start, next);
}

function environment(names) {
  const steps = [];
  const warnings = [];
  const choices = { subjects: [], chapters: [], topics: [] };
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '', innerText: '', classList: {add() {},remove() {}},
      children: [], appendChild(x) { this.children.push(x); },
      set innerHTML(value) { this._innerHTML = value; this.children.length = 0; },
      get innerHTML() { return this._innerHTML; }
    });
    return elements.get(id);
  };
  const ctx = {
    wizardSelection: {
      scope: 'topic-wise',
      selectedSubjects: ['Biology'],
      selectedChapters: [],
      selectedTopics: [],
      mcqCount: 0,
      testMode: 'tutor'
    },
    pmdcSyllabus: {Biology: {'Chapter A': ['Topic A'], 'Chapter B': ['Topic B']}},
    mcqQuestionBank: [
      {subject:'Biology',chapter:'Chapter A',topic:'Topic A',revisionId:11},
      {subject:'Biology',chapter:'Chapter B',topic:'Topic B',revisionId:12}
    ],
    isSingleLevelPracticeSubject: subject => subject === 'English' || subject === 'Logical Reasoning',
    wizardQuestionFiltersActive: false,
    document: {
      getElementById:element,
      createElement:() => ({className:'',innerText:'',innerHTML:''}),
      querySelectorAll:selector => {
        if(selector === '.chapter-chk:checked') return choices.chapters.map(value=>({value}));
        if(selector === '.topic-chk:checked') return choices.topics.map(value=>({value}));
        if(selector === '.subject-chk:checked') return choices.subjects.map(value=>({value}));
        return [];
      }
    },
    setWizardStep: n => steps.push(n),
    renderChapterCheckboxes: () => {},
    renderTopicOptions: () => {},
    renderSubjectChoices: () => {},
    getAvailableSubjects: () => ['Biology'],
    updateWizardAvailableCount: () => {},
    updateSummaryBox: () => {},
    alert: text => warnings.push(text),
    escapeHtml: text => String(text),
    window: {innerWidth: 390},
    Number, String, Array, Set, Map
  };
  vm.createContext(ctx);
  for(const name of names) vm.runInContext(functionSource(name),ctx);
  return {ctx,steps,warnings,choices,elements,element};
}

test('Stage 2 student-facing wording keeps separate past-papers product and existing selection IDs',()=>{
  const area=src.slice(src.indexOf('<section id="module-wizard"'),src.indexOf('<section id="module-quiz"'));
  assert.match(area,/Practice past MDCAT questions by subject, chapter, or topic\./);
  assert.doesNotMatch(area,/The only question bank in this LMS\. It starts empty/);
  assert.match(area,/full-syllabus practice test covering all subjects/);
  assert.match(area,/One or Multiple Subjects/);
  assert.match(area,/Select one or multiple subjects and practise their full syllabus/);
  assert.match(area,/Select one or multiple subjects for your practice test/);
  assert.match(src,/wizardSelection\.scope === 'subject-wise' \? 'One or Multiple Subjects'/);
  assert.match(area,/chapter-wise practice test by selecting one or multiple chapters/);
  assert.match(area,/selectPracticeScope\('subject-wise'\)/);
  assert.match(area,/selectPracticeScope\('custom-mix'\)/);
  assert.match(area,/selectPracticeScope\('topic-wise'\)/);
  assert.match(area,/value="" oninput="setCustomMcqCount\(this.value\)"/);
  assert.match(area,/hover:border-blue-500/);
  assert.match(area,/hover:border-emerald-500/);
  assert.match(area,/hover:border-amber-500/);
});

test('Topic Drill requires a chapter and advances to topics; Custom Quiz may choose all',()=>{
  const e=environment(['confirmChapterSelection']);
  let topicsCalls=0;
  e.ctx.renderTopicOptions=()=>{topicsCalls++;};
  e.ctx.wizardSelection.scope='topic-wise';
  e.ctx.confirmChapterSelection();
  assert.equal(e.warnings.length,1);
  assert.equal(e.steps.length,0);
  assert.equal(topicsCalls,0);
  e.choices.chapters=['Biology|||Chapter A'];
  e.ctx.wizardSelection.selectedTopics=['Biology|||Chapter A|||Topic A','Biology|||Chapter B|||Topic B'];
  e.ctx.confirmChapterSelection();
  assert.equal(e.steps.at(-1),32);
  assert.equal(topicsCalls,1);
  assert.equal(e.ctx.wizardSelection.selectedChapters.join(','),'Biology|||Chapter A');
  assert.equal(e.ctx.wizardSelection.selectedTopics.join(','),'Biology|||Chapter A|||Topic A');
  e.ctx.wizardSelection.scope='custom-mix';
  e.choices.chapters=[];
  e.ctx.confirmChapterSelection();
  assert.equal(e.steps.at(-1),4);
  assert.equal(e.ctx.wizardSelection.selectedChapters.join(','),'All Chapters');
});

test('Subject selection goes to chapter step for Topic Drill, but to Settings for full-syllabus subjects',()=>{
  const e=environment(['confirmSubjectSelection']);
  e.choices.subjects=['Biology'];
  e.ctx.confirmSubjectSelection();
  assert.equal(e.steps.at(-1),31);
  e.ctx.wizardSelection.scope='subject-wise';
  e.ctx.confirmSubjectSelection();
  assert.equal(e.steps.at(-1),4);
  assert.equal(e.ctx.wizardSelection.selectedChapters.join(','),'All Chapters');
});

test('Topic list and saved selection remain scoped to chosen chapter',()=>{
  const e=environment(['renderTopicOptions','confirmTopicSelection']);
  e.ctx.wizardSelection.selectedChapters=['Biology|||Chapter A'];
  e.ctx.renderTopicOptions(['Biology']);
  const labels=e.element('topic-options-container').children.map(x=>x.innerHTML).join(' ');
  assert.match(labels,/Topic A/);
  assert.doesNotMatch(labels,/Topic B/);
  e.choices.topics=['Biology|||Chapter A|||Topic A'];
  e.ctx.confirmTopicSelection();
  assert.equal(e.steps.at(-1),4);
  assert.equal(e.ctx.wizardSelection.selectedChapters.join(','),'Biology|||Chapter A');
});

test('Back from Topic Drill Topics returns to Chapters; Custom Quiz retains existing behavior',()=>{
  const e=environment(['prevWizardStep']);
  e.ctx.wizardSelection.currentStepNum=32;
  e.ctx.prevWizardStep();
  assert.equal(e.steps.at(-1),31);
  e.ctx.wizardSelection.currentStepNum=31;
  e.ctx.prevWizardStep();
  assert.equal(e.steps.at(-1),3);
  e.ctx.wizardSelection.currentStepNum=4;
  e.ctx.wizardSelection.scope='topic-wise';
  e.ctx.prevWizardStep();
  assert.equal(e.steps.at(-1),32);
  e.ctx.wizardSelection.scope='custom-mix';
  e.ctx.prevWizardStep();
  assert.equal(e.steps.at(-1),31);
});

test('Number input accepts valid user choices, keeps blank invalid and does not silently choose 1',()=>{
  const e=environment(['setMcqCount','setCustomMcqCount']);
  e.ctx.setCustomMcqCount('');
  assert.equal(e.ctx.wizardSelection.mcqCount,0);
  e.ctx.setCustomMcqCount('abc');
  assert.equal(e.ctx.wizardSelection.mcqCount,0);
  e.ctx.setCustomMcqCount('12.5');
  assert.equal(e.ctx.wizardSelection.mcqCount,0);
  e.ctx.setCustomMcqCount('23');
  assert.equal(e.ctx.wizardSelection.mcqCount,23);
  e.ctx.setMcqCount(50);
  assert.equal(e.ctx.wizardSelection.mcqCount,50);
  assert.equal(e.element('custom-mcq-count').value,'50');
  assert.doesNotMatch(src,/window\.setCustomMcqCount=window\.setMcqCount/);
  assert.match(src,/Please choose a valid number of MCQs before starting/);
  assert.match(src,/if \(!retaking && \(!Number\.isSafeInteger\(wizardSelection\.mcqCount\)/);
  assert.match(src,/window\.startQuick5Mcqs=function\(\)\{wizardSelection=.*mcqCount:5/);
});


test('Create Test lists only published subjects, chapters and topics with available MCQs',()=>{
  const e=environment(['getAvailableSubjects','renderSubjectChoices','renderChapterCheckboxes','renderTopicOptions']);
  e.ctx.mcqQuestionBank=[
    {subject:'Biology',chapter:'Biological Molecules',topic:'Proteins',revisionId:1},
    {subject:'Physics',chapter:'Force & Motion',topic:'Projectile Motion',revisionId:2}
  ];
  assert.equal(Array.from(e.ctx.getAvailableSubjects()).join(','),'Biology,Physics');
  e.ctx.renderSubjectChoices();
  const subjectLabels=e.element('subject-checkbox-container').children.map(x=>x.innerHTML).join(' ');
  assert.match(subjectLabels,/Biology/);assert.match(subjectLabels,/Physics/);
  assert.doesNotMatch(subjectLabels,/Chemistry|English|Logical Reasoning/);
  e.ctx.renderChapterCheckboxes(['Biology','Physics','Chemistry']);
  const chapterLabels=e.element('chapter-checkbox-container').children.map(x=>x.innerHTML).join(' ');
  assert.match(chapterLabels,/Biological Molecules/);assert.match(chapterLabels,/Force &amp; Motion|Force & Motion/);
  assert.doesNotMatch(chapterLabels,/Chapter 1:|Chapter 2:|General Chapter/);
  e.ctx.wizardSelection.selectedChapters=['Biology|||Biological Molecules','Physics|||Force & Motion'];
  e.ctx.renderTopicOptions(['Biology','Physics']);
  const topicLabels=e.element('topic-options-container').children.map(x=>x.innerHTML).join(' ');
  assert.match(topicLabels,/Proteins/); assert.match(topicLabels,/Projectile Motion/);
  assert.doesNotMatch(topicLabels,/ATP Synthesis|Syllogisms|Logic Gates|Ohm Law/);
  e.ctx.mcqQuestionBank=[];
  assert.equal(e.ctx.getAvailableSubjects().length,0);
  e.ctx.renderSubjectChoices();
  assert.match(e.element('subject-checkbox-container').innerHTML,/No subjects have published MCQs/);
  e.ctx.renderChapterCheckboxes(['Biology','Physics']);
  assert.equal(e.element('chapter-checkbox-container').children.length,0);
});

test('Flat English/Logical Reasoning topic step has no subtopic checkbox and can continue',()=>{
  const e=environment(['confirmChapterSelection','renderTopicOptions','confirmTopicSelection']);
  e.ctx.wizardSelection.selectedSubjects=['English','Logical Reasoning'];
  e.ctx.mcqQuestionBank=[
    {id:201,subject:'English',chapter:'Spellings',topic:null,bank:'Past Papers Question Bank',revisionId:201},
    {id:202,subject:'English',chapter:'Verb',topic:'Verb',bank:'Past Papers Question Bank',revisionId:202},
    {id:203,subject:'Logical Reasoning',chapter:'Critical Thinking',topic:null,bank:'Past Papers Question Bank',revisionId:203}
  ];
  e.choices.chapters=['English|||Spellings','Logical Reasoning|||Critical Thinking'];
  e.ctx.confirmChapterSelection();
  assert.equal(e.steps.at(-1),32,'Keep explanatory Topic step in wizard');
  assert.equal(e.element('topic-options-container').children.length,1,'Only an explanatory note, no nested topics');
  assert.match(e.element('topic-options-container').children[0].textContent,/chapter is also a topic/);
  assert.match(e.element('sjn-topic-instructions').innerText,/No additional topics/);
  e.ctx.confirmTopicSelection();
  assert.equal(e.warnings.length,0,'Flat-only test does not require choosing a nonexistent subtopic');
  assert.equal(e.steps.at(-1),4);
  assert.equal(e.ctx.wizardSelection.selectedTopics.length,0);
  const p=environment(['getFilteredQuestionPool']);
  p.ctx.mcqQuestionBank=e.ctx.mcqQuestionBank;
  p.ctx.wizardSelection={...e.ctx.wizardSelection,bank:'Past Papers Question Bank'};
  const allowed=Array.from(p.ctx.getFilteredQuestionPool()).map(x=>x.id);
  assert.deepEqual(allowed,[201,203],'Only selected flat chapters, not all English chapters');
});

test('Mixed Physics + English Topic Drill includes chosen flat chapter and chosen science topics only',()=>{
  const e=environment(['confirmChapterSelection','renderTopicOptions','confirmTopicSelection','getFilteredQuestionPool']);
  e.ctx.wizardSelection.selectedSubjects=['Physics','English'];
  e.ctx.wizardSelection.bank='Past Papers Question Bank';
  e.ctx.mcqQuestionBank=[
    {id:301,bank:'Past Papers Question Bank',subject:'Physics',chapter:'Force & Motion',topic:'Projectile Motion',revisionId:301},
    {id:302,bank:'Past Papers Question Bank',subject:'Physics',chapter:'Force & Motion',topic:'Momentum',revisionId:302},
    {id:303,bank:'Past Papers Question Bank',subject:'English',chapter:'Spellings',topic:null,revisionId:303},
    {id:304,bank:'Past Papers Question Bank',subject:'English',chapter:'Verb',topic:null,revisionId:304}
  ];
  e.choices.chapters=['Physics|||Force & Motion','English|||Spellings'];
  e.ctx.confirmChapterSelection();
  const checkboxLabels=e.element('topic-options-container').children.map(x=>x.innerHTML||'').join(' ');
  assert.match(checkboxLabels,/Projectile Motion|Momentum/);
  assert.doesNotMatch(checkboxLabels,/English.*General Topic|English.*Spellings.*topic-chk/);
  e.ctx.confirmTopicSelection();
  assert.equal(e.steps.at(-1),32,'Science topics cannot be silently skipped');
  assert.match(e.warnings[0],/science topic/);
  e.choices.topics=['Physics|||Force & Motion|||Projectile Motion'];
  e.ctx.confirmTopicSelection();
  assert.equal(e.steps.at(-1),4);
  const ids=Array.from(e.ctx.getFilteredQuestionPool()).map(x=>x.id);
  assert.deepEqual(ids,[301,303],'No unselected Physics topic or English chapter');
  e.choices.chapters=['English|||Verb'];
  e.ctx.confirmChapterSelection();
  assert.deepEqual(Array.from(e.ctx.wizardSelection.selectedTopics),[],'Back changing chapters clears old science topic');
  e.ctx.confirmTopicSelection();
  assert.equal(e.steps.at(-1),4);
  assert.deepEqual(Array.from(e.ctx.getFilteredQuestionPool()).map(x=>x.id),[304]);
});

test('Science-only topic drill still requires science selection; flat categories stay explicit',()=>{
  const e=environment(['getFilteredQuestionPool','confirmTopicSelection']);
  e.ctx.wizardSelection.bank='Past Papers Question Bank';
  e.ctx.wizardSelection.selectedSubjects=['Physics'];
  e.ctx.wizardSelection.selectedChapters=['Physics|||Force & Motion'];
  e.ctx.mcqQuestionBank=[{id:1,bank:'Past Papers Question Bank',subject:'Physics',chapter:'Force & Motion',topic:'Momentum',revisionId:1}];
  assert.deepEqual(Array.from(e.ctx.getFilteredQuestionPool()),[], 'No selected science topics must never default to all');
  e.ctx.confirmTopicSelection();
  assert.equal(e.steps.length,0);
  assert.match(e.warnings[0],/science topic/);
  e.choices.topics=['Physics|||Force & Motion|||Momentum'];
  e.ctx.confirmTopicSelection();
  assert.equal(e.steps.at(-1),4);
  assert.deepEqual(Array.from(e.ctx.getFilteredQuestionPool()).map(x=>x.id),[1]);
});
