'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'..');
const results = fs.readFileSync(path.join(root,'public/sjn-phase4-results.js'),'utf8');
const exam = fs.readFileSync(path.join(root,'public/sjn-phase4-preview.js'),'utf8');
const history = fs.readFileSync(path.join(root,'public/sjn-history.js'),'utf8');
const html = fs.readFileSync(path.join(root,'public/index.html'),'utf8');

test('Results actions keep approved presentation and parse cleanly',()=>{
  assert.doesNotThrow(()=>new vm.Script(results));
  assert.doesNotThrow(()=>new vm.Script(exam));
  assert.match(results,/id="sjn-results-review" disabled/);
  assert.match(results,/id="sjn-results-retake" disabled/);
  assert.doesNotMatch(results,/will be available after secure question-level attempt history is implemented/);
  assert.match(results,/id="sjn-results-insights"/);
  assert.match(results,/Practice Test Completed!/);
});
test('Results actions require server-confirmed student-owned saved detail',()=>{
  assert.match(results,/verifiedAttemptId = confirmed \? outcome\.id : null/);
  assert.match(results,/Number\.isSafeInteger\(outcome\.id\)/);
  assert.match(results,/window\.SJNHistoryFetchAttempt\(attemptId\)/);
  assert.match(results,/payload\.reviewAvailable !== true \|\| payload\.retakeAvailable !== true/);
  assert.match(results,/payload\.items\.length !== Number\(payload\.attempt\.total\)/);
  assert.match(results,/version !== showVersion/);
  assert.match(results,/window\.SJNPhase4Exam\.reviewSavedAttempt\(payload\)/);
  assert.match(results,/await window\.SJNHistoryLaunchRetake\(payload\)/);
  assert.match(results,/window\.SJNPhase4Exam\?\.isOpen\?\.\(\) !== true/);
});
test('Review reuses unchanged original exam and freezes answers and timer',()=>{
  assert.match(exam,/window\.SJNPhase4Exam = \{/);
  assert.match(exam,/reviewSavedAttempt\(payload\)/);
  assert.match(exam,/state\.reviewOnly = review/);
  assert.match(exam,/state\.checked = Array\(currentQuizList\.length\)\.fill\(review\)/);
  assert.match(exam,/const checked = state\.reviewOnly \|\|/);
  assert.match(exam,/if \(checked \|\| state\.reviewOnly\) return/);
  assert.match(exam,/if \(review\) \{\s*stopClock\(\)/);
  assert.match(exam,/if \(state\.reviewOnly\) \{ returnFromReview\(\); return; \}/);
  assert.match(exam,/window\.SJNPhase4Results\?\.restoreAfterReview\(\)/);
  assert.match(exam,/payload\.items\.filter\(item => item\.isCorrect\)\.length !== Number\(payload\.attempt\.correct\)/);
  assert.match(exam,/new Set\(questions\.map\(q => q\.id\)\)\.size !== questions\.length/);
});
test('Test History Review remains independent and exact-order Retake is reused',()=>{
  assert.match(history,/showDetail\(payload,mode\)/);
  assert.match(history,/window\.SJNHistoryLaunchRetake\(payload\)/);
  assert.match(html,/window\.launchGeneratedQuiz\(questions\)/);
  assert.match(html,/currentQuizList = retaking \? pool\.slice\(\) : shuffleArray\(pool\)/);
  assert.match(exam,/if \(state\.open\) return;\s*origLaunch\.apply\(this, args\)/);
});

test('Returning from saved exam Review restores both Results buttons repeatedly',async()=>{
  // Exercise the actual Results Screen script with a small fake DOM. Earlier
  // source-only checks missed that opening Review disabled buttons permanently.
  const nodes = new Map();
  function node(){
    const listeners = new Map();
    return {
      disabled:false, hidden:false, style:{}, className:'', textContent:'',
      classList:{add(){},remove(){},toggle(){}},
      setAttribute(){}, append(){}, replaceChildren(){},
      addEventListener(type,callback){ listeners.set(type,callback); },
      click(){
        assert.equal(this.disabled,false,'a disabled control cannot be activated');
        listeners.get('click')?.();
      }
    };
  }
  const workspace=node(), section=node(), body=node();
  const getNode=id=>{
    if(!nodes.has(id))nodes.set(id,node());
    return nodes.get(id);
  };
  let reviewCount=0, fetchedCount=0;
  const payload={
    attempt:{id:123,total:1},items:[{position:1}],reviewAvailable:true,retakeAvailable:true
  };
  const window={
    location:{search:'?sjnPhase4Preview=1',pathname:'/index.html'},
    history:{replaceState(){}},addEventListener(){},
    async SJNHistoryFetchAttempt(id){assert.equal(id,123);fetchedCount++;return payload;},
    SJNPhase4Exam:{reviewSavedAttempt(p){assert.equal(p,payload);reviewCount++;}}
  };
  const document={
    body,querySelector(selector){assert.equal(selector,'main');return workspace;},
    createElement(){return node();},
    getElementById:getNode,
    querySelectorAll(selector){assert.equal(selector,'.module-view');return [section];}
  };
  vm.runInNewContext(results,{document,window,URLSearchParams,Math,Promise});
  const actions=window.SJNPhase4Results;
  assert.equal(typeof actions?.restoreAfterReview,'function');
  const report={questions:[{subject:'Biology',chapter:'Cell',topic:'DNA',correctIndex:0}],
    answers:[0],elapsedSeconds:12};
  actions.show(report,Promise.resolve({
    saved:true,id:123,total:1,correct:1,incorrect:0,skipped:0,accuracy:100
  }));
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  await flush();
  const review=getNode('sjn-results-review'),retake=getNode('sjn-results-retake');
  assert.equal(review.disabled,false);
  assert.equal(retake.disabled,false);
  for(let i=1;i<=3;i++){
    review.click();
    await flush();
    assert.equal(reviewCount,i);
    assert.equal(fetchedCount,i);
    assert.equal(review.disabled,true,'review action is disabled while exam is open');
    assert.equal(retake.disabled,true,'retake action is disabled while exam is open');
    actions.restoreAfterReview();
    assert.equal(review.disabled,false,'returning to verified Results must re-enable Review');
    assert.equal(retake.disabled,false,'returning to verified Results must re-enable Retake');
    assert.equal(getNode('sjn-results-score').textContent,'1 / 1');
  }
  // No calls to the submit endpoint, changes to scores or new attempts
  // are made by the Results Screen's read-only review/return sequence.
});

test('Restoring Results cannot enable Review or Retake after an unverified save',async()=>{
  const source=results.match(/function restoreAfterReview\(\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(source,'saved-results return guard exists');
  assert.match(source,/if \(!verifiedAttemptId \|\| pendingSave \|\| openingAction\) return/);
  assert.match(source,/\$\('sjn-results-review'\)\.disabled = false/);
  assert.match(source,/\$\('sjn-results-retake'\)\.disabled = false/);
});
