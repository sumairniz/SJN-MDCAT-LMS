/* SJN Phase 4 — Test History presentation and read-only completed-test review.
 * Own-account history only. The approved live MCQ interface is not restyled.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const state = {
    logs: [], status: 'loading', source: 'all', mode: 'all',
    statusFilter: 'all', date: 'newest', query: '',
    detail: null, filter: 'all', current: 0, busy: false, navigatorVisible: true
  };
  const PAGE_SIZE = 25;
  let listPage = 1;
  const text = value => String(value == null ? '' : value);
  const dateLabel = value => {
    const n = Date.parse(value);
    return Number.isFinite(n) ? new Date(n).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    }) : 'Date unavailable';
  };
  function sourceOf(log) {
    if (log.sourceKind && ['past','sjn','courses','mock'].includes(log.sourceKind))
      return log.sourceKind;
    const value = text(log.title).toLowerCase();
    if (value.includes('past papers question bank')) return 'past';
    // A full past-paper examination has its own separate source class in
    // future assessment builders; never classify a paper as the question bank
    // merely because it mentions IBA/MDCAT or a year.
    if (value.includes('sjn question bank')) return 'sjn';
    // Other titles have no reliable source type in pre-existing summary data.
    return 'other';
  }
  const sourceTitle = key => ({
    past:'Past Papers Question Bank',sjn:'SJN Question Bank',courses:'Courses',
    mock:'Mock Tests',other:'Other tests'
  })[key] || 'Other tests';
  function subjectNames(log) {
    const names = Array.isArray(log.subjects) ? log.subjects : [];
    const clean = [...new Set(names.filter(x => typeof x === 'string' &&
      x.trim() && x.trim().toLowerCase() !== 'all subjects').map(x=>x.trim()))];
    return clean.length ? clean : [text(log.subject || 'Mixed')];
  }
  const displaySubjects = (log,mobile=false) => {
    const names=subjectNames(log);
    return mobile && names.length>2 ? names.length+' Subjects' : names.join(' · ');
  };
  const el = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = text(value);
    return node;
  };
  function icon(name, color) {
    const i = el('i', 'fa-solid fa-' + name + (color ? ' ' + color : ''));
    i.setAttribute('aria-hidden','true');
    return i;
  }
  function button(label, type, handler, disabled, tooltip) {
    const btn = el('button', 'sjn-history-action sjn-history-action-' + type);
    btn.type = 'button';
    const typeIcon = type === 'results' ? 'chart-simple' : type === 'review' ? 'book-open' : 'rotate-right';
    btn.append(icon(typeIcon), el('span', '', label));
    if (disabled) {
      btn.disabled = true;
      btn.title = tooltip || 'Question-level history is not available for this old test';
    } else btn.addEventListener('click', handler);
    return btn;
  }
  function actions(log) {
    const group = el('div','sjn-history-actions');
    if (log.status === 'in-progress') {
      group.append(button('Resume','retake',()=>resumeDraft(log.id),false));
      return group;
    }
    const old = log.detailsVersion !== 1;
    group.append(
      button('Results','results',()=>open(log.id,'results'),false),
      button('Review','review',()=>open(log.id,'review'),old),
      button('Retake','retake',()=>open(log.id,'retake'),old)
    );
    return group;
  }
  async function resumeDraft(id) {
    if(state.busy)return;
    state.busy=true;
    try{await window.SJNDrafts.resume(id);}
    catch(error){window.alert(error?.message || 'Unable to resume your test.');}
    finally{state.busy=false;}
  }
  function filtered() {
    const query = state.query.trim().toLowerCase();
    const rows = state.logs.filter(log => {
      if (state.source !== 'all' && sourceOf(log) !== state.source) return false;
      if (state.mode !== 'all' && log.mode !== state.mode) return false;
      if (state.statusFilter !== 'all' && log.status !== state.statusFilter) return false;
      const search = [log.title,log.subject,...subjectNames(log),log.mode,sourceTitle(sourceOf(log)),
        ...(Array.isArray(log.chapters)?log.chapters:[]),
        ...(Array.isArray(log.topics)?log.topics:[])
      ].map(text).join(' ').toLowerCase();
      return !query || search.includes(query);
    });
    rows.sort((a,b) => {
      const av = Date.parse(a.date) || 0, bv = Date.parse(b.date) || 0;
      return state.date === 'oldest' ? av-bv : bv-av;
    });
    return rows;
  }
  function metadata(log) {
    const wrap = el('div','sjn-history-badges');
    wrap.append(el('span','sjn-history-source',sourceTitle(sourceOf(log))),
      el('span','sjn-history-mode',text(log.mode).toUpperCase()));
    return wrap;
  }
  function render() {
    const tbody = $('history-table-body');
    const mobile = $('sjn-history-mobile-list');
    if (!tbody || !mobile) return;
    tbody.replaceChildren(); mobile.replaceChildren();
    const total = state.status === 'ready' ? state.logs.length : 0;
    $('sjn-history-total').textContent = String(total);
    const completed=state.status==='ready'?state.logs.filter(x=>x.status!=='in-progress').length:0;
    $('sjn-history-completed').textContent = String(completed);
    if (state.status !== 'ready') {
      $('sjn-history-list-pagination').hidden = true;
      showMessage(state.status === 'error' ? 'Could not load your saved test history. Please retry.' :
        'Loading your saved test history…',state.status === 'error');
      return;
    }
    const rows = filtered();
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    listPage = Math.min(Math.max(1, listPage), pageCount);
    const pagination = $('sjn-history-list-pagination');
    pagination.hidden = rows.length <= PAGE_SIZE;
    $('sjn-history-list-page').textContent = 'Page ' + listPage;
    $('sjn-history-list-prev').disabled = listPage === 1;
    $('sjn-history-list-next').disabled = listPage === pageCount;
    $('sjn-history-found').textContent = rows.length + ' of ' + total + ' recorded tests';
    if (!rows.length) {
      showMessage(total ? 'No saved tests match these filters.' : 'No tests completed yet.');
      return;
    }
    for (const log of rows.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE)) {
      const tr=el('tr','sjn-history-row');
      const titleCell=el('td','sjn-history-title-cell');
      titleCell.append(el('strong','',log.title),el('small','',dateLabel(log.date)));
      const subject=el('td','',displaySubjects(log));
      const mode=el('td','sjn-history-mode-cell',text(log.mode).toUpperCase());
      const isDraft=log.status==='in-progress';
      const score=el('td','sjn-history-score-cell'+(isDraft?' is-in-progress':''),isDraft?'In Progress':log.score);
      if(isDraft)score.append(el('small','sjn-history-progress-count',log.answered+' / '+log.total+' answered'));
      const completePercent=isDraft && Number(log.total)>0
        ? Math.round(100*Number(log.answered)/Number(log.total)) : 0;
      const acc=el('td','',isDraft?completePercent+'% Complete':log.accuracy);
      const actionCell=el('td','sjn-history-desktop-actions');actionCell.append(actions(log));
      tr.append(titleCell,subject,mode,score,acc,actionCell);tbody.append(tr);
      const card=el('article','sjn-history-card'+(isDraft?' is-in-progress':''));
      const heading=el('div','sjn-history-card-heading');
      const left=el('div','sjn-history-card-name');
      left.append(el('strong','',log.title),el('small','',dateLabel(log.date)));
      const scoreBlock=el('div','sjn-history-card-score');
      scoreBlock.append(el('strong','',log.status==='in-progress'?'In Progress':log.score),el('small','',log.status==='in-progress'?(log.answered+' / '+log.total+' answered'):log.accuracy));
      heading.append(left,scoreBlock);
      card.append(heading,metadata(log));
      const line=el('div','sjn-history-card-footer');
      const subjectLabel=el('span','',displaySubjects(log,true));
      subjectLabel.title=displaySubjects(log);
      line.append(subjectLabel,el('span','', log.status==='in-progress'?'In Progress':'Completed'));
      card.append(line,actions(log));
      mobile.append(card);
    }
  }
  function showMessage(msg, retry) {
    const tbody=$('history-table-body'), mobile=$('sjn-history-mobile-list');
    if (!tbody || !mobile) return;
    const tr=el('tr');
    const td=el('td','sjn-history-empty',msg);td.colSpan=6;
    if(retry && typeof window.reloadStudentHistory === 'function') {
      const btn=el('button','sjn-history-retry','Retry');btn.type='button';
      btn.addEventListener('click',()=>window.reloadStudentHistory());
      td.append(btn);
    }
    tr.append(td);tbody.append(tr);
    const card=el('div','sjn-history-empty',msg);
    if (retry) {
      const btn=el('button','sjn-history-retry','Retry');btn.type='button';
      btn.addEventListener('click',()=>window.reloadStudentHistory?.());
      card.append(btn);
    }
    mobile.append(card);
    $('sjn-history-found').textContent='';
  }
  function setFilters() {
    state.query=$('sjn-history-search')?.value || '';
    state.source=$('sjn-history-source')?.value || 'all';
    state.mode=$('sjn-history-mode')?.value || 'all';
    state.statusFilter=$('sjn-history-status')?.value || 'all';
    state.date=$('sjn-history-date')?.value || 'newest';
    listPage = 1;
    render();
  }
  function setup() {
    $('sjn-history-list-prev')?.addEventListener('click',()=>{
      if (listPage > 1) { listPage--; render(); }
    });
    $('sjn-history-list-next')?.addEventListener('click',()=>{
      if (listPage * PAGE_SIZE < filtered().length) { listPage++; render(); }
    });
    ['sjn-history-search','sjn-history-source','sjn-history-mode',
     'sjn-history-status','sjn-history-date'].forEach(id => {
      $(id)?.addEventListener(id.endsWith('-search')?'input':'change',setFilters);
    });
    $('sjn-history-back')?.addEventListener('click',closeDetail);
    $('sjn-history-nav-toggle')?.addEventListener('click',()=>{
      state.navigatorVisible=!state.navigatorVisible;
      syncNavigatorVisibility();
    });
    $('sjn-history-prev')?.addEventListener('click',()=>selectQuestion(state.current-1));
    $('sjn-history-next')?.addEventListener('click',()=>selectQuestion(state.current+1));
    $('sjn-history-filter-toggle')?.addEventListener('click', () => {
      const grid=$('sjn-history-filter-grid'),button=$('sjn-history-filter-toggle');
      const expanded=button.getAttribute('aria-expanded')==='true';
      button.setAttribute('aria-expanded',String(!expanded));
      grid.classList.toggle('is-open',!expanded);
    });
    $('sjn-history-review-filter')?.addEventListener('change',e=>{
      state.filter=e.target.value;selectQuestion(0,true);
    });
  }
  function syncNavigatorVisibility(){
    const navigator=$('sjn-history-question-nav');
    const toggle=$('sjn-history-nav-toggle');
    if(!navigator||!toggle)return;
    navigator.classList.toggle('hidden',!state.navigatorVisible);
    toggle.setAttribute('aria-expanded',String(state.navigatorVisible));
    toggle.setAttribute('aria-label',state.navigatorVisible?'Hide Question Navigator':'Show Question Navigator');
    const label=$('sjn-history-nav-toggle-label');
    if(label)label.textContent=state.navigatorVisible?'Hide Navigator':'Show Navigator';
    const eye=toggle.querySelector('i');
    if(eye)eye.className=state.navigatorVisible?'fa-solid fa-eye-slash':'fa-solid fa-eye';
  }
  function formatTimeTaken(seconds){
    if(!Number.isFinite(seconds)||seconds<0)return null;
    const n=Math.floor(seconds),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;
    return h ? h+'h '+m+'m '+s+'s' : m ? m+'m '+s+'s' : s+'s';
  }
  function closeDetail() {
    $('sjn-history-detail')?.classList.add('hidden');
    $('sjn-history-list-view')?.classList.remove('hidden');
    state.detail=null;state.busy=false;
  }
  function detailError(message) {
    const target=$('sjn-history-detail-error');
    if (!target)return;
    target.textContent=text(message);
    target.classList.remove('hidden');
  }
  const outcomeOf = item => item.selectedIndex === null?'unanswered':item.isCorrect?'correct':'incorrect';
  function matchingItems() {
    const items=state.detail?.items || [];
    if (state.filter === 'all') return items;
    if (state.filter === 'marked')return items.filter(item=>item.marked);
    return items.filter(item=>outcomeOf(item)===state.filter);
  }
  function selectQuestion(index, reset=false) {
    const list=matchingItems();
    if(reset)index=0;
    state.current=Math.max(0,Math.min(index,Math.max(0,list.length-1)));
    renderQuestion();
  }
  function renderQuestion() {
    const detail=state.detail, area=$('sjn-history-question');
    const navigator=$('sjn-history-question-nav');
    if(!detail||!area||!navigator)return;
    area.replaceChildren();navigator.replaceChildren();
    const list=matchingItems();
    $('sjn-history-index').textContent=list.length?(state.current+1)+' of '+list.length:'0 of 0';
    $('sjn-history-prev').disabled=state.current<=0;
    $('sjn-history-next').disabled=state.current>=list.length-1;
    if(!list.length){area.append(el('p','sjn-history-empty','No questions match this filter.'));return;}
    list.forEach((item,index)=>{
      const btn=el('button','sjn-history-number'+(index===state.current?' is-current':'')+
        ' is-'+outcomeOf(item)+(item.marked?' is-marked':''),String(item.position));
      if(item.marked){
        const flag=icon('bookmark');
        flag.classList.add('sjn-history-number-bookmark');
        btn.append(flag);
        btn.title='Question '+item.position+' · '+outcomeOf(item)+' · marked';
      }
      btn.type='button';btn.addEventListener('click',()=>selectQuestion(index));
      navigator.append(btn);
    });
    const item=list[state.current];
    const top=el('div','sjn-history-question-top');
    top.append(el('span','sjn-history-review-number','Question '+item.position),
      el('span','sjn-history-review-status is-'+outcomeOf(item),
        outcomeOf(item)==='unanswered'?'Skipped':outcomeOf(item)==='correct'?'Correct':'Incorrect'));
    area.append(top,el('h3','sjn-history-question-text',item.question));
    const opts=el('div','sjn-history-review-options');
    item.options.forEach((option,index)=>{
      let cls='sjn-history-review-option';
      if(index===item.correctIndex)cls+=' is-answer';
      if(index===item.selectedIndex && index!==item.correctIndex)cls+=' is-wrong';
      const line=el('div',cls);
      line.append(el('span','sjn-history-letter','ABCD'[index]),el('span','sjn-history-option-text',option));
      if(index===item.correctIndex)line.append(el('strong','sjn-history-option-label','Correct answer'));
      else if(index===item.selectedIndex)line.append(el('strong','sjn-history-option-label','Your answer'));
      opts.append(line);
    });
    area.append(opts);
    if(item.selectedIndex===null)area.append(el('p','sjn-history-skipped-note','You skipped this question.'));
    if(item.explanation){const expl=el('div','sjn-history-explanation');expl.append(el('strong','', 'Explanation'),el('p','',item.explanation));area.append(expl);}
    if(item.mnemonic){const mnemonic=el('div','sjn-history-mnemonic');mnemonic.append(el('strong','', 'SJN Mnemonic / Tip'),el('p','',item.mnemonic));area.append(mnemonic);}
    const mark=el('button','sjn-history-mark',item.marked?'Unmark Question':'Mark for Review');
    mark.type='button';mark.append(icon('bookmark'));
    mark.addEventListener('click',async()=>{
      if(state.busy)return;state.busy=true;mark.disabled=true;
      try {
        const result=await window.SJNHistoryToggleMark(item.mcqId);
        item.marked=result.bookmarked===true;
        renderQuestion();
      }catch(err){detailError(err.message || 'Unable to update mark.');}
      finally{state.busy=false;mark.disabled=false;}
    });
    area.append(mark);
  }
  function showDetail(payload,mode) {
    state.detail=payload;state.filter='all';state.current=0;
    state.navigatorVisible=true;
    syncNavigatorVisibility();
    $('sjn-history-list-view').classList.add('hidden');
    $('sjn-history-detail').classList.remove('hidden');
    $('sjn-history-detail-error').classList.add('hidden');
    $('sjn-history-review-filter').value='all';
    const attempt=payload.attempt;
    $('sjn-history-detail-title').textContent=attempt.title || 'Practice Test';
    const total=Number(attempt.total)||0, correct=Number(attempt.correct)||0;
    $('sjn-history-detail-score').textContent=correct+' / '+total+' · '+Math.round(Number(attempt.accuracy)||0)+'%';
    const actualSubjects=payload.reviewAvailable && Array.isArray(payload.items)
      ? [...new Set(payload.items.map(item=>item.subject).filter(Boolean))]
      : Array.isArray(attempt.selection?.subjects)
        ? attempt.selection.subjects.filter(x=>typeof x==='string' && x!=='All Subjects') : [];
    const subjectText=actualSubjects.length ? actualSubjects.join(' · ') :
      text(attempt.subject || 'Mixed');
    const duration=formatTimeTaken(attempt.elapsedSeconds);
    $('sjn-history-detail-subtitle').textContent=
      subjectText+' · '+text(attempt.mode).toUpperCase()+
      ' · '+dateLabel(attempt.date)+(duration===null?'':' · Time Taken: '+duration);
    $('sjn-history-review-area').classList.toggle('hidden',mode!=='review');
    $('sjn-history-summary-only').classList.toggle('hidden',payload.reviewAvailable);
    $('sjn-history-summary-only').textContent=payload.reviewAvailable?
      '':'This older test has a saved result, but individual questions were not recorded.';
    if(mode==='review')selectQuestion(0,true);
  }
  async function open(id,mode) {
    if(state.busy || !Number.isSafeInteger(id) || id<1)return;
    state.busy=true;
    try {
      const payload=await window.SJNHistoryFetchAttempt(id);
      if(!payload?.attempt || payload.attempt.id!==id)
        throw new Error('Unable to verify this completed test.');
      if(mode==='retake'){
        if(payload.retakeAvailable!==true || !Array.isArray(payload.items))
          throw new Error('This older test cannot be retaken because its original questions were not saved.');
        await window.SJNHistoryLaunchRetake(payload);
        return;
      }
      if(mode==='review' && payload.reviewAvailable!==true)
        throw new Error('Review is unavailable for this older summary-only test.');
      if (mode==='results' && payload.reviewAvailable &&
          window.SJNPhase4Results && typeof window.SJNPhase4Results.show==='function') {
        const items=payload.items;
        const correct=Number(payload.attempt.correct);
        const skipped=items.filter(item=>item.selectedIndex===null).length;
        window.SJNPhase4Results.show({
          questions:items.map(item=>({
            subject:item.subject,chapter:item.chapter,topic:item.topic,correctIndex:item.correctIndex
          })),
          answers:items.map(item=>item.selectedIndex),
          elapsedSeconds:Number(payload.attempt.elapsedSeconds)||0
        },Promise.resolve({
          saved:true,id:payload.attempt.id,total:items.length,correct,
          skipped,incorrect:items.length-correct-skipped,
          accuracy:Number(payload.attempt.accuracy)
        }));
        return;
      }
      showDetail(payload,mode);
    }catch(error){window.alert(error?.message || 'Unable to open this test.');}
    finally{state.busy=false;}
  }
  window.SJNHistory={
    render(logs,status){
      state.logs=Array.isArray(logs)?logs:[];
      state.status=status==='ready'?'ready':status==='error'?'error':'loading';
      render();
    },
    closeDetail
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();