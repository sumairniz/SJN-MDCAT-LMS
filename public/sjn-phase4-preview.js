/* SJN Phase 4 — staged SPA exam workspace.
 * Opt-in on development/staging via ?sjnPhase4Preview=1.
 * Until secure draft persistence is shipped, the existing quiz flow remains
 * the default. This module does NOT claim Save & Exit or recovery support.
 */
(() => {
  'use strict';
  const search = new URLSearchParams(window.location.search);
  if (search.get('sjnPhase4Preview') !== '1') {
    // TEMP-P4-001: Preview is intentionally opt-in, but never leave a staging
    // tester guessing which exam is active when auth removes the URL flag.
    const announceLegacy = () => {
      // A legacy-mode indicator must not appear on the production dashboard.
      // The server exposes this endpoint only in Vercel Preview.
      fetch('/api/preview-status', { credentials: 'same-origin', cache: 'no-store' })
        .then(async response => response.ok ? response.json() : null)
        .then(info => {
          if (!info || info.environment !== 'preview' ||
              info.project !== 'aozknkrwafowsrehdwlr') return;
          const dashboard = document.getElementById('module-dashboard');
          const wizard = document.getElementById('module-wizard');
          if (!dashboard || !wizard) return;
          for (const section of [dashboard, wizard]) {
            const label = document.createElement('p');
            label.setAttribute('role', 'status');
            label.style.cssText = 'padding:8px 12px;margin:0 0 12px;border:1px solid #a16207;border-radius:8px;background:#18181b;color:#fcd34d;font-size:11px;font-weight:600';
            label.textContent = 'LEGACY EXAM MODE · Phase 4 preview is not active. Use the authorized staging preview link to test the new exam.';
            section.prepend(label);
          }
        })
        .catch(() => {});
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', announceLegacy, { once: true });
    else announceLegacy();
    return;
  }

  const $ = (id) => document.getElementById(id);
  const EXAM_URL = '/quiz/session?sjnPhase4Preview=1';
  const HOME_URL = '/index.html?sjnPhase4Preview=1';
  const state = {
    open: false, navigatorOpen: true, checked: [], seconds: 0,
    startedAt: 0, interval: null, ending: false, modal: null,
    reviewOnly: false, reviewPrevious: null,
    draftId: null, draftVersion: 0, savingDraft: false
  };
  const html = `
    <section id="sjn-exam-preview" class="module-view hidden sjn-exam-workspace" aria-label="Practice examination">
      <div class="sjn-exam-container">
        <header class="sjn-exam-topbar">
          <button type="button" class="sjn-exam-icon" id="sjn-exam-exit" aria-label="Exit test" title="Exit test"><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i></button>
          <span class="sjn-exam-brand" aria-label="SJN MDCAT LMS Pro">SJN <span>EXAM</span></span>
          <span class="sjn-exam-mode" id="sjn-exam-mode">Tutor</span>
          <span class="sjn-exam-progress" id="sjn-exam-progress" aria-live="polite">1 / 1</span>
          <div class="sjn-exam-progress-track" id="sjn-exam-answered-progress" role="progressbar" aria-label="Answered question progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0 of 0 questions answered" title="Answered questions">
            <span id="sjn-exam-answered-bar" class="sjn-exam-progress-fill"></span>
          </div>
          <div class="sjn-exam-timer" title="Minutes and seconds"><i class="fa-regular fa-clock" aria-hidden="true"></i> <span id="sjn-exam-clock">00:00</span></div>
          <button type="button" id="sjn-exam-nav-toggle" class="sjn-exam-icon" aria-label="Toggle question navigator" aria-controls="sjn-exam-navigator" aria-expanded="true" title="Question navigator"><i class="fa-solid fa-table-cells" aria-hidden="true"></i></button>
          <button type="button" id="sjn-exam-submit" class="sjn-exam-submit">Submit</button>
        </header>
        <div class="sjn-exam-layout" id="sjn-exam-layout">
          <article class="sjn-exam-card" aria-label="Current question">
            <div class="sjn-exam-card-top">
              <div class="sjn-exam-meta">
                <span class="sjn-exam-subject" id="sjn-exam-subject">Biology</span>
                <span class="sjn-exam-chapter" id="sjn-exam-chapter"></span>
                <span class="sjn-exam-source-row" id="sjn-exam-source-row"></span>
              </div>
              <div class="sjn-exam-card-actions">
                <button type="button" class="sjn-exam-mark" id="sjn-exam-mark" aria-pressed="false" aria-label="Mark for Review" title="Mark for Review"><i class="fa-regular fa-bookmark" aria-hidden="true"></i><span>Mark for Review</span></button>
                <button type="button" class="sjn-exam-report-trigger" id="sjn-exam-report-trigger" aria-label="Report MCQ Issue" title="Report MCQ Issue"><i class="fa-regular fa-flag" aria-hidden="true"></i><span>Report Issue</span></button>
              </div>
            </div>
            <p class="sjn-exam-counter" id="sjn-exam-counter">Question 1</p>
            <h1 class="sjn-exam-question" id="sjn-exam-question"></h1>
            <div id="sjn-exam-options" class="sjn-exam-options" role="group" aria-label="Answer options"></div>
            <div id="sjn-exam-feedback" class="sjn-exam-feedback hidden" aria-live="polite">
              <p id="sjn-exam-feedback-label" class="sjn-exam-feedback-title"></p>
              <div class="sjn-exam-explanation-panel">
                <p class="sjn-exam-explanation-heading">Concept Explanation</p>
                <p id="sjn-exam-explanation"></p>
              </div>
              <div class="sjn-exam-mnemonic"><strong>SJN Mnemonic / Tip</strong><p id="sjn-exam-mnemonic"></p></div>
            </div>
            <div class="sjn-exam-bottom">
              <button type="button" id="sjn-exam-prev" class="sjn-exam-secondary"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Previous</button>
              <button type="button" id="sjn-exam-next" class="sjn-exam-secondary sjn-exam-next"><span id="sjn-exam-next-label">Next</span> <i id="sjn-exam-next-icon" class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
            </div>
          </article>
          <aside id="sjn-exam-navigator" class="sjn-exam-navigator" aria-label="Question navigator">
            <div class="sjn-exam-nav-heading">
              <strong>Question Navigator</strong>
              <button type="button" id="sjn-exam-close-nav" class="sjn-exam-icon sjn-exam-close-nav" aria-label="Close navigator"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="sjn-exam-number-grid" class="sjn-exam-number-grid"></div>
            <div id="sjn-exam-stats" class="sjn-exam-stats" aria-live="polite"></div>
            <p class="sjn-exam-legend">Marked questions have an amber outline. You can jump directly to any question.</p>
          </aside>
        </div>
      </div>
      <div id="sjn-exam-nav-backdrop" class="sjn-exam-backdrop hidden"></div>
      <div id="sjn-exam-dialog" class="sjn-exam-dialog-layer hidden" role="presentation">
        <div class="sjn-exam-dialog" role="dialog" aria-modal="true" aria-labelledby="sjn-exam-dialog-title" aria-describedby="sjn-exam-dialog-message">
          <h2 id="sjn-exam-dialog-title"></h2>
          <p id="sjn-exam-dialog-message"></p>
          <div id="sjn-exam-dialog-actions" class="sjn-exam-dialog-actions"></div>
        </div>
      </div>
      <!-- Phase 4 Stage 2: report dialog is visual-only until secure storage is built. -->
      <div id="sjn-exam-report-layer" class="sjn-exam-report-layer hidden" role="presentation">
        <div class="sjn-exam-report-panel" role="dialog" aria-modal="true" aria-labelledby="sjn-exam-report-title" aria-describedby="sjn-exam-report-subtitle">
          <div class="sjn-exam-report-head">
            <div>
              <h2 id="sjn-exam-report-title">Report an Issue</h2>
              <p id="sjn-exam-report-subtitle">What's wrong with this question?</p>
            </div>
            <button type="button" class="sjn-exam-report-close sjn-exam-icon" id="sjn-exam-report-close" aria-label="Close report dialog"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
          </div>
          <form id="sjn-exam-report-form">
            <fieldset class="sjn-exam-report-reasons">
              <legend class="sjn-exam-report-legend">Select one or more reasons</legend>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="wrong-answer-key"><i class="fa-solid fa-key" aria-hidden="true"></i><span>Wrong answer key</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="question-statement-error"><i class="fa-solid fa-file-circle-exclamation" aria-hidden="true"></i><span>Question statement error</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="incorrect-option"><i class="fa-solid fa-list-ul" aria-hidden="true"></i><span>Incorrect option</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="wrong-explanation"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Wrong explanation</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="missing-explanation"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i><span>Missing explanation</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="typo-spelling"><i class="fa-solid fa-pencil" aria-hidden="true"></i><span>Typo / spelling error</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="ambiguous-wording"><i class="fa-regular fa-circle-question" aria-hidden="true"></i><span>Ambiguous wording</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="duplicate-question"><i class="fa-regular fa-copy" aria-hidden="true"></i><span>Duplicate question</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="out-of-syllabus"><i class="fa-solid fa-ban" aria-hidden="true"></i><span>Out of Syllabus</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="outdated-information"><i class="fa-regular fa-calendar" aria-hidden="true"></i><span>Outdated information</span></label>
              <label class="sjn-exam-report-reason"><input type="checkbox" name="sjn-report-reason" value="technical-issue"><i class="fa-solid fa-gear" aria-hidden="true"></i><span>Technical issue</span></label>
            </fieldset>
            <label class="sjn-exam-report-details-label" for="sjn-exam-report-details">Additional details <span>(optional)</span></label>
            <textarea id="sjn-exam-report-details" class="sjn-exam-report-details" rows="3" maxlength="2000" placeholder="Describe the issue, if you like..."></textarea>
            <p class="sjn-exam-report-notice">Interface preview only — reports are not being saved or sent yet.</p>
            <p class="sjn-exam-report-status" id="sjn-exam-report-status" aria-live="polite"></p>
            <div class="sjn-exam-report-actions">
              <button type="button" id="sjn-exam-report-cancel" class="sjn-exam-secondary">Cancel</button>
              <button type="submit" id="sjn-exam-report-submit" class="sjn-exam-dialog-primary" disabled>Submit Report</button>
            </div>
          </form>
        </div>
      </div>
    </section>`;

  const workspace = document.querySelector('main');
  if (!workspace) return;
  workspace.insertAdjacentHTML('beforeend', html);
  const stage = $('sjn-exam-preview');
  // TEMP-P4-007: visual and database changes can be verified against the deployed commit.
  function showBuildVerification() {
    const targets = ['module-dashboard', 'module-wizard'].map(id => {
      const area = $(id);
      if (!area) return null;
      const label = document.createElement('p');
      label.style.cssText = 'padding:8px 12px;margin:0 0 12px;border:1px solid #52525b;border-radius:8px;background:#18181b;color:#d4d4d8;font-size:11px;font-weight:600;line-height:1.5;overflow-wrap:anywhere';
      label.setAttribute('role', 'status');
      label.textContent = 'PHASE 4 PREVIEW · Checking deployed build and database…';
      area.prepend(label);
      return label;
    }).filter(Boolean);
    const display = (message, warn) => targets.forEach(label => {
      label.textContent = message; label.style.color = warn ? '#fcd34d' : '#d4d4d8';
    });
    fetch('/api/preview-status', { cache: 'no-store', credentials: 'same-origin' })
      .then(async r => { if (!r.ok) throw new Error('Status failed'); return r.json(); })
      .then(s => {
        if (s.environment !== 'preview' || !Number.isSafeInteger(s.mcqCount)) throw new Error('Invalid status');
        if (s.project !== 'aozknkrwafowsrehdwlr') {
          display('PHASE 4 PREVIEW · WRONG DATABASE — DO NOT TEST', true); return;
        }
        const commit = /^[a-f0-9]{40}$/.test(s.commit || '') ? s.commit.slice(0, 8) : 'unavailable';
        display('PHASE 4 PREVIEW · Commit ' + commit + ' · Supabase ' + s.project +
          ' · ' + s.mcqCount + ' MCQs' + (commit === 'unavailable' ? ' · BUILD NOT VERIFIED' : ''),
          commit === 'unavailable');
      })
      .catch(() => display('PHASE 4 PREVIEW · Build/database verification unavailable; do not approve technical tests', true));
  }
  showBuildVerification();

  const numeric = (value) => String(Math.max(0, value)).padStart(2, '0');
  const clock = (seconds) => numeric(Math.floor(seconds / 60)) + ':' + numeric(seconds % 60);
  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
  const answers = () => currentQuizList.reduce((n, q, i) => n + (userAnswers[i] !== null ? 1 : 0), 0);
  function calculateAnsweredProgress(answerList, total) {
    return total > 0 ? Math.round(100 * answerList.filter(answer => answer !== null && answer !== undefined).length / total) : 0;
  }
  function isLastQuestion(index, total) {
    return total > 0 && index === total - 1;
  }
  // Display-only bookmark intent. The existing authenticated server writer is
  // authoritative; no speculative persistent bookmark/cache/filter mutation.
  const pendingMarkRequests = new Map();
  const activeMarkWriters = new Set();
  const marked = (q) => {
    if (!q) return false;
    const key = String(q.id);
    return pendingMarkRequests.has(key)
      ? pendingMarkRequests.get(key)
      : bookmarkedMcqs.some(id => String(id) === key);
  };
  function renderMarkAction(q) {
    const btn = $('sjn-exam-mark');
    const selected = marked(q);
    const pending = pendingMarkRequests.has(String(q.id));
    const label = selected ? 'Marked' : 'Mark for Review';
    btn.classList.toggle('is-marked', selected);
    btn.classList.toggle('is-saving', pending);
    btn.setAttribute('aria-pressed', String(selected));
    btn.setAttribute('aria-busy', String(pending));
    // Every tap is accepted; the writer serializes requests per MCQ.
    btn.disabled = false;
    btn.querySelector('i').className = (selected ? 'fa-solid' : 'fa-regular') + ' fa-bookmark';
    btn.querySelector('span').textContent = label;
    btn.setAttribute('aria-label', pending ? label + ', saving' : label);
    btn.title = pending ? 'Saving mark…' : label;
  }
  async function persistMarkIntention(q) {
    const key = String(q.id);
    if (activeMarkWriters.has(key)) return;
    activeMarkWriters.add(key);
    try {
      while (pendingMarkRequests.has(key)) {
        const desired = pendingMarkRequests.get(key);
        const confirmed = bookmarkedMcqs.some(id => String(id) === key);
        if (desired === confirmed) break;
        // One authenticated API request at a time for this question. If a
        // second tap happens during it, apply the newest intent after it settles.
        const saved = await window.toggleBookmarkCurrentMcq(q.id);
        if (saved !== true) break; // Existing writer reports error; restore.
      }
    } finally {
      pendingMarkRequests.delete(key);
      activeMarkWriters.delete(key);
      if (state.open && String(currentQuizList[currentMcqIndex]?.id) === key)
        renderMarkAction(currentQuizList[currentMcqIndex]);
      if (state.open) renderNumbers();
    }
  }

  function setURL(url, replace = false) {
    const fn = replace ? 'replaceState' : 'pushState';
    window.history[fn]({ sjnPhase4Preview: true }, '', url);
  }
  function stopClock() {
    if (state.interval) window.clearInterval(state.interval);
    state.interval = null;
    if (quizTimerInterval) window.clearInterval(quizTimerInterval);
    quizTimerInterval = null;
  }
  function closeModal() {
    $('sjn-exam-dialog').classList.add('hidden');
    state.modal = null;
  }
  function dialog(title, message, actions) {
    state.modal = title;
    $('sjn-exam-dialog-title').textContent = title;
    $('sjn-exam-dialog-message').textContent = message;
    const slot = $('sjn-exam-dialog-actions');
    slot.replaceChildren();
    for (const action of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = action.primary ? 'sjn-exam-dialog-primary' :
        action.discard ? 'sjn-exam-dialog-discard' : 'sjn-exam-secondary';
      button.textContent = action.label;
      button.addEventListener('click', () => { closeModal(); action.run(); });
      slot.appendChild(button);
    }
    $('sjn-exam-dialog').classList.remove('hidden');
    slot.querySelector('button')?.focus();
  }
  function updateClock() {
    if (!state.open) return;
    if (wizardSelection.testMode === 'timed') {
      $('sjn-exam-clock').textContent = clock(state.seconds);
      if (state.seconds <= 0) {
        stopClock();
        completeTest();
      } else state.seconds--;
    } else {
      state.seconds++;
      $('sjn-exam-clock').textContent = clock(state.seconds);
    }
  }
  function startClock() {
    stopClock();
    state.seconds = wizardSelection.testMode === 'timed' ? currentQuizList.length * 60 : 0;
    $('sjn-exam-clock').textContent = clock(state.seconds);
    state.startedAt = Date.now();
    state.interval = window.setInterval(updateClock, 1000);
  }
  function renderNumbers() {
    const area = $('sjn-exam-number-grid');
    area.replaceChildren();
    currentQuizList.forEach((q, i) => {
      const selected = userAnswers[i];
      const isTutor = wizardSelection.testMode !== 'timed' || state.reviewOnly;
      let status = selected === null ? 'unanswered' : isTutor && (state.checked[i] || state.reviewOnly) ? selected === q.correctIndex ? 'correct' : 'incorrect' : 'answered';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sjn-exam-number is-' + status + (i === currentMcqIndex ? ' is-current' : '') + (marked(q) ? ' is-marked' : '');
      button.textContent = String(i + 1);
      button.setAttribute('aria-label', 'Question ' + (i + 1) + ', ' + status + (marked(q) ? ', marked' : ''));
      if (i === currentMcqIndex) button.setAttribute('aria-current', 'step');
      button.addEventListener('click', () => goTo(i));
      area.appendChild(button);
    });
    const correct = currentQuizList.reduce((n, q, i) => n + ((state.checked[i] || state.reviewOnly) && userAnswers[i] === q.correctIndex ? 1 : 0), 0);
    const incorrect = currentQuizList.reduce((n, q, i) => n + ((state.checked[i] || state.reviewOnly) && userAnswers[i] !== null && userAnswers[i] !== q.correctIndex ? 1 : 0), 0);
    const list = [['Answered', answers()], ['Unanswered', currentQuizList.length - answers()], ['Marked', currentQuizList.filter(marked).length]];
    if (wizardSelection.testMode !== 'timed') list.unshift(['Incorrect', incorrect], ['Correct', correct]);
    const stats = $('sjn-exam-stats');
    stats.replaceChildren();
    for (const [label, value] of list) {
      const item = document.createElement('div');
      const text = document.createElement('span'); text.textContent = label;
      const n = document.createElement('strong'); n.textContent = String(value);
      item.append(text, n);
      stats.append(item);
    }
  }
  function renderQuestion() {
    const q = currentQuizList[currentMcqIndex];
    if (!state.open || !q) return;
    $('sjn-exam-subject').textContent = q.subject;
    $('sjn-exam-progress').textContent = (currentMcqIndex + 1) + ' / ' + currentQuizList.length;
    const completed = answers();
    const percent = calculateAnsweredProgress(userAnswers, currentQuizList.length);
    $('sjn-exam-answered-bar').style.width = percent + '%';
    $('sjn-exam-answered-progress').setAttribute('aria-valuenow', String(percent));
    $('sjn-exam-answered-progress').setAttribute('aria-valuetext', completed + ' of ' + currentQuizList.length + ' questions answered');
    $('sjn-exam-answered-progress').title = completed + ' of ' + currentQuizList.length + ' questions answered';
    $('sjn-exam-counter').textContent = 'Question ' + (currentMcqIndex + 1);
    $('sjn-exam-question').textContent = q.question;
    // Single-level English/Logical Reasoning display a single category name.
    // Science subjects retain their original chapter | topic treatment.
    $('sjn-exam-chapter').textContent = (q.subject === 'English' || q.subject === 'Logical Reasoning')
      ? (q.chapter || q.topic || 'General Chapter')
      : (q.chapter || 'Chapter') + '  |  ' + (q.topic || 'General Topic');
    const src = $('sjn-exam-source-row');
    src.replaceChildren();
    if (q.source) {
      const b = document.createElement('span');
      b.className = 'sjn-exam-source';
      b.textContent = q.source === 'NUMS MDCAT 2026 — third-party marked paper' ? 'NUMS MDCAT 2026' : q.source;
      src.append(b);
    }
    renderMarkAction(q);
    const options = $('sjn-exam-options'); options.replaceChildren();
    const isTutor = wizardSelection.testMode !== 'timed' || state.reviewOnly;
    const checked = state.reviewOnly || (isTutor && state.checked[currentMcqIndex]);
    q.options.forEach((option, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      const selected = userAnswers[currentMcqIndex] === i;
      let status = '';
      if (checked && i === q.correctIndex) status = ' is-correct';
      else if (checked && selected) status = ' is-incorrect';
      else if (selected) status = ' is-selected';
      b.className = 'sjn-exam-option' + status;
      if (checked) b.disabled = true;
      b.setAttribute('aria-pressed', String(selected));
      const letter = document.createElement('span');
      letter.className = 'sjn-exam-letter'; letter.textContent = 'ABCD'[i];
      const label = document.createElement('span');
      label.className = 'sjn-exam-option-label'; label.textContent = option;
      b.append(letter, label);
      if (checked && (i === q.correctIndex || selected)) {
        const indicator = document.createElement('span');
        const correctChoice = i === q.correctIndex;
        indicator.className = 'sjn-exam-answer-indicator' + (correctChoice ? ' is-correct' : ' is-incorrect');
        indicator.setAttribute('aria-label', correctChoice ? 'Correct answer' : 'Incorrect selection');
        const icon = document.createElement('i');
        icon.className = correctChoice ? 'fa-solid fa-check' : 'fa-solid fa-xmark';
        icon.setAttribute('aria-hidden', 'true');
        indicator.append(icon);
        b.append(indicator);
      }
      b.addEventListener('click', () => {
        if (checked || state.reviewOnly) return;
        userAnswers[currentMcqIndex] = i;
        if (isTutor) state.checked[currentMcqIndex] = true;
        renderQuestion();
      });
      options.append(b);
    });
    const box = $('sjn-exam-feedback');
    box.classList.toggle('hidden', !checked);
    if (checked) {
      const label = $('sjn-exam-feedback-label');
      label.textContent = 'Correct Answer: ' + 'ABCD'[q.correctIndex] + '. ' + q.options[q.correctIndex];
      label.className = 'sjn-exam-feedback-title is-correct';
      $('sjn-exam-explanation').textContent = q.explanation || 'No explanation provided.';
      $('sjn-exam-mnemonic').textContent = q.mnemonic || 'No mnemonic provided.';
    }
    $('sjn-exam-prev').disabled = currentMcqIndex === 0;
    const finalQuestion = isLastQuestion(currentMcqIndex, currentQuizList.length);
    const nextButton = $('sjn-exam-next');
    nextButton.classList.toggle('is-finish', finalQuestion);
    $('sjn-exam-next-label').textContent = finalQuestion ? 'Finish' : 'Next';
    $('sjn-exam-next-icon').className = finalQuestion ? 'fa-solid fa-check' : 'fa-solid fa-arrow-right';
    nextButton.disabled = false;
    renderNumbers();
  }
  function closeNavigator() {
    state.navigatorOpen = false;
    $('sjn-exam-layout').classList.add('nav-hidden');
    $('sjn-exam-nav-backdrop').classList.add('hidden');
    $('sjn-exam-nav-toggle').setAttribute('aria-expanded', 'false');
  }
  function toggleNavigator() {
    if (state.navigatorOpen) closeNavigator();
    else {
      state.navigatorOpen = true;
      $('sjn-exam-layout').classList.remove('nav-hidden');
      $('sjn-exam-nav-toggle').setAttribute('aria-expanded', 'true');
      $('sjn-exam-nav-backdrop').classList.toggle('hidden', !isMobile());
    }
  }
  function goTo(i) {
    if (!Number.isInteger(i) || i < 0 || i >= currentQuizList.length) return;
    currentMcqIndex = i;
    renderQuestion();
    if (isMobile()) closeNavigator();
  }
  function closeExam() {
    if (!state.open) return;
    closeReport(false);
    stopClock();
    state.open = false;
    closeModal();
    closeNavigator();
    document.body.classList.remove('sjn-phase4-exam-active');
    stage.classList.add('hidden');
  }
  function returnFromReview() {
    if (!state.open || !state.reviewOnly) return;
    const prior = state.reviewPrevious;
    closeExam();
    state.reviewOnly = false;
    state.reviewPrevious = null;
    if (prior) {
      currentQuizList = prior.questions;
      userAnswers = prior.answers;
      currentMcqIndex = prior.index;
      wizardSelection = prior.wizardSelection;
    }
    // Saved review is read-only: no scoring, submission or new attempt.
    window.SJNPhase4Results?.restoreAfterReview();
  }
  const newUuid = () => window.crypto?.randomUUID?.();
  function draftPayload(reset) {
    if (!currentQuizList.length || !currentSubmissionKey) throw new Error('Current test has no verified question identity.');
    if (!state.draftId) state.draftId = newUuid();
    if (!state.draftId) throw new Error('Your browser cannot create a secure draft identifier.');
    // The dashboard's paperSourceFilter is private to its auth closure.
    // Derive a meaningful label from the actual saved question set instead.
    const commonSource = currentQuizList[0]?.source;
    const title = historyRetakeTitle ||
      (commonSource && currentQuizList.every(q=>q.source===commonSource) ? commonSource : wizardSelection.bank) ||
      'Practice Test';
    const items = currentQuizList.map(q=>({mcqId:q.id,revisionId:q.revisionId}));
    if(items.some(x=>!Number.isSafeInteger(x.mcqId)||!Number.isSafeInteger(x.revisionId)))
      throw new Error('Question identities could not be verified.');
    return {
      id:state.draftId,version:state.draftVersion,
      submissionKey:currentSubmissionKey,
      title:String(title),
      mode:wizardSelection.testMode,
      subject:String(wizardSelection.subject || 'Mixed'),
      selection:{
        bank:wizardSelection.bank,scope:wizardSelection.scope,
        subjects:wizardSelection.selectedSubjects,
        chapters:wizardSelection.selectedChapters,topics:wizardSelection.selectedTopics
      },items,
      answers:reset?items.map(()=>null):userAnswers.slice(),
      checked:reset?items.map(()=>false):state.checked.slice(),
      currentIndex:reset?0:currentMcqIndex,
      elapsedSeconds:reset?0:Math.min(86400,Math.max(0,Math.floor((Date.now()-state.startedAt)/1000))),
      remainingSeconds:wizardSelection.testMode==='timed'
        ? (reset?items.length*60:Math.max(0,Math.floor(state.seconds))):null
    };
  }
  async function exitWithDraft(reset) {
    if (state.savingDraft || !state.open || state.reviewOnly) return;
    state.savingDraft=true;
    const exitButton=$('sjn-exam-exit');
    exitButton.disabled=true;
    try {
      // An existing confirmed Save & Exit is the student's checkpoint.
      // "Exit Without Saving" discards ONLY this session's unsaved changes;
      // never overwrite that server-saved draft with zero answers.
      // A never-saved test still creates its original zero-progress draft.
      const discardToLastSave = reset && state.draftId && state.draftVersion > 0;
      if (!discardToLastSave) {
        const draft=draftPayload(reset);
        const saved=await window.SJNDrafts?.save(draft);
        if(!saved?.saved || saved.id!==draft.id || !Number.isSafeInteger(saved.version))
          throw new Error('Your unfinished test could not be confirmed saved.');
        state.draftVersion=saved.version;
      }
      window.SJNExamRecovery?.forget();
      closeExam();
      currentQuizList=[];userAnswers=[];state.checked=[];
      state.draftId=null;state.draftVersion=0;
      setURL(HOME_URL,true);
      switchModule('history');
      // switchModule('history') already starts the one required refresh.
      // Do not launch a second request after the same confirmed draft write.
    }catch(error){
      window.alert(error?.message || 'Unable to save your unfinished test. You are still in the exam.');
    }finally{state.savingDraft=false;exitButton.disabled=false;}
  }
  function leaveUnsaved() {
    closeExam();
    // This is intentionally loss-aware while persistent drafts remain unimplemented.
    currentQuizList = [];
    userAnswers = [];
    state.checked = [];
    switchModule('wizard');
    setURL(HOME_URL, true);
  }
  function requestExit() {
    if (state.reviewOnly) { returnFromReview(); return; }
    const message = state.draftId && state.draftVersion > 0
      ? 'Save & Exit keeps your latest changes. Exit Without Saving keeps your last confirmed Save & Exit and discards only changes made since then.'
      : 'Save & Exit preserves your answers. Exit Without Saving keeps this question set but restarts it with zero answers.';
    dialog('Exit this practice test?', message, [
      { label: 'Cancel', run() {} },
      { label: 'Exit Without Saving', discard: true, run() { void exitWithDraft(true); } },
      { label: 'Save & Exit', run() { void exitWithDraft(false); }, primary: true }
    ]);
  }
  function completeTest() {
    if (!state.open || state.ending || state.savingDraft) return;
    state.ending = true;
    closeExam();
    setURL(HOME_URL, true);
    // Capture the completed attempt before the existing authenticated saver runs.
    // The result view uses no browser-wide storage; history review waits for Stage 3B.
    const snapshot = {
      questions: currentQuizList.map(q => ({
        subject: q.subject, chapter: q.chapter, topic: q.topic, correctIndex: q.correctIndex
      })),
      answers: userAnswers.slice(),
      elapsedSeconds: Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000))
    };
    // Preserve the original authenticated save path, student-ID and 24-hour checks.
    const savePromise = window.finishQuiz({ elapsedSeconds: snapshot.elapsedSeconds });
    if (window.SJNPhase4Results) window.SJNPhase4Results.show(snapshot, savePromise);
    Promise.resolve(savePromise).finally(() => { state.ending = false; });
  }
  function requestSubmission() {
    if (state.reviewOnly) { returnFromReview(); return; }
    if (state.ending) return;
    const n = currentQuizList.length - answers();
    if (n) {
      dialog('Submit Your Test?', 'You have ' + n + ' unanswered question' + (n === 1 ? '' : 's') + '. Review them or submit your test now.', [
        { label: 'Review Unanswered', run() { goTo(userAnswers.findIndex(x => x === null)); } },
        { label: 'Submit Anyway', run: completeTest, primary: true }
      ]);
    } else {
      dialog('Submit Your Test?', 'Are you ready to finish this practice test and view the result?', [
        { label: 'Cancel', run() {} },
        { label: 'Submit Test', run: completeTest, primary: true }
      ]);
    }
  }
  function enterExam(review = false, savedElapsedSeconds = 0) {
    if (!currentQuizList.length || state.open) return;
    state.open = true; state.ending = false;
    if (!review) {state.draftId=null;state.draftVersion=0;}
    state.reviewOnly = review;
    state.checked = Array(currentQuizList.length).fill(review);
    state.navigatorOpen = true;
    $('sjn-exam-mode').textContent = wizardSelection.testMode === 'timed' ? 'Timed' : 'Tutor';
    // Same exam controls and geometry; the existing submit action returns
    // to Results rather than submitting a second score in read-only review.
    $('sjn-exam-submit').textContent = review ? 'Results' : 'Submit';
    $('sjn-exam-submit').title = review ? 'Return to completed test results' : '';
    document.querySelectorAll('.module-view').forEach(view => view.classList.add('hidden'));
    stage.classList.remove('hidden');
    document.body.classList.add('sjn-phase4-exam-active');
    $('sjn-exam-layout').classList.remove('nav-hidden');
    $('sjn-exam-nav-backdrop').classList.add('hidden');
    $('sjn-exam-nav-toggle').setAttribute('aria-expanded', 'true');
    if (isMobile()) closeNavigator();
    setURL(EXAM_URL);
    if (review) {
      stopClock();
      $('sjn-exam-clock').textContent = clock(Math.max(0, Math.floor(savedElapsedSeconds)));
    } else startClock();
    renderQuestion();
    workspace.scrollTop = 0;
    $('sjn-exam-question').focus?.();
  }
  const reportLayer = $('sjn-exam-report-layer');
  const reportForm = $('sjn-exam-report-form');
  const reportSubmit = $('sjn-exam-report-submit');
  const reportStatus = $('sjn-exam-report-status');
  function closeReport(restoreFocus = true) {
    const wasOpen = !reportLayer.classList.contains('hidden');
    reportLayer.classList.add('hidden');
    document.body.classList.remove('sjn-phase4-report-open');
    reportForm.reset();
    reportSubmit.disabled = true;
    reportStatus.textContent = '';
    if (wasOpen && restoreFocus && state.open) $('sjn-exam-report-trigger').focus();
  }
  function openReport() {
    if (!state.open) return;
    closeModal();
    reportForm.reset();
    reportSubmit.disabled = true;
    reportStatus.textContent = '';
    reportLayer.classList.remove('hidden');
    document.body.classList.add('sjn-phase4-report-open');
    reportLayer.querySelector('input[type="checkbox"]')?.focus();
  }
  $('sjn-exam-report-trigger').addEventListener('click', openReport);
  $('sjn-exam-report-close').addEventListener('click', () => closeReport());
  $('sjn-exam-report-cancel').addEventListener('click', () => closeReport());
  reportLayer.addEventListener('click', (event) => { if (event.target === reportLayer) closeReport(); });
  reportForm.addEventListener('change', () => {
    reportSubmit.disabled = !reportForm.querySelector('input[name="sjn-report-reason"]:checked');
    reportStatus.textContent = '';
  });
  reportForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (reportSubmit.disabled) return;
    // Backend and authenticated report storage are deliberately deferred.
    // Never tell a student that a report was submitted when it was not.
    reportStatus.textContent = 'Report submission is not active yet. Nothing has been sent or saved.';
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !reportLayer.classList.contains('hidden')) {
      event.preventDefault();
      closeReport();
    }
  });

  $('sjn-exam-exit').addEventListener('click', requestExit);
  $('sjn-exam-submit').addEventListener('click', requestSubmission);
  $('sjn-exam-prev').addEventListener('click', () => goTo(currentMcqIndex - 1));
  $('sjn-exam-next').addEventListener('click', () => {
    if (isLastQuestion(currentMcqIndex, currentQuizList.length)) requestSubmission();
    else goTo(currentMcqIndex + 1);
  });
  $('sjn-exam-nav-toggle').addEventListener('click', toggleNavigator);
  $('sjn-exam-close-nav').addEventListener('click', closeNavigator);
  $('sjn-exam-nav-backdrop').addEventListener('click', closeNavigator);
  $('sjn-exam-mark').addEventListener('click', () => {
    const q = state.open && currentQuizList[currentMcqIndex];
    if (!q) return;
    const key = String(q.id);
    pendingMarkRequests.set(key, !marked(q));
    renderMarkAction(q);
    renderNumbers();
    void persistMarkIntention(q);
  });
  window.addEventListener('beforeunload', (e) => {
    if (!state.open || state.reviewOnly) return;
    e.preventDefault(); e.returnValue = '';
  });
  window.addEventListener('popstate', () => {
    if (state.open && state.reviewOnly && window.location.pathname !== '/quiz/session') {
      returnFromReview();
      return;
    }
    if (state.open && window.location.pathname !== '/quiz/session') {
      // Back must not silently throw away an attempt.
      setURL(EXAM_URL);
      requestExit();
    } else if (!state.open && window.location.pathname === '/quiz/session') {
      setURL(HOME_URL, true);
      switchModule('wizard');
    }
  });
  const origLaunch = window.launchGeneratedQuiz;
  window.launchGeneratedQuiz = function (...args) {
    if (state.open) return;
    origLaunch.apply(this, args);
    if (currentQuizList.length && !$('module-quiz').classList.contains('hidden')) {
      enterExam();
      window.SJNExamRecovery?.rememberNew();
    }
  };
  // Results Screen Review intentionally reuses the approved examination
  // workspace, not Test History's separate review presentation.
  window.SJNPhase4Exam = {
    isOpen: () => state.open,
    resumeSavedDraft(draft) {
      if(state.open || !draft || !Number.isSafeInteger(draft.version))
        throw new Error('Cannot restore an unfinished test.');
      enterExam();
      window.SJNExamRecovery?.rememberDraft(draft.id);
      state.draftId=draft.id;
      state.draftVersion=draft.version;
      state.checked=draft.checked.slice();
      state.seconds=draft.mode==='timed'?draft.remainingSeconds:draft.elapsedSeconds;
      state.startedAt=Date.now()-draft.elapsedSeconds*1000;
      $('sjn-exam-clock').textContent=clock(state.seconds);
      renderQuestion();
    },
    reviewSavedAttempt(payload) {
      if (state.open || state.reviewOnly) throw new Error('Close the current test before reviewing.');
      if (!payload || payload.reviewAvailable !== true || !payload.attempt ||
          !Number.isSafeInteger(payload.attempt.id) || payload.attempt.id < 1 ||
          !Array.isArray(payload.items) || !payload.items.length ||
          payload.items.length !== Number(payload.attempt.total))
        throw new Error('Verified saved question details are required for review.');
      const questions = payload.items.map((item, i) => {
        const valid = item && item.position === i + 1 &&
          Number.isSafeInteger(item.mcqId) && item.mcqId > 0 &&
          Number.isSafeInteger(item.revisionId) && item.revisionId > 0 &&
          Array.isArray(item.options) && item.options.length === 4 &&
          Number.isInteger(item.correctIndex) && item.correctIndex >= 0 && item.correctIndex < 4 &&
          (item.selectedIndex === null || (Number.isInteger(item.selectedIndex) &&
            item.selectedIndex >= 0 && item.selectedIndex < 4)) &&
          item.isCorrect === (item.selectedIndex !== null && item.selectedIndex === item.correctIndex);
        if (!valid) throw new Error('Historical question integrity could not be verified.');
        return {
          id: item.mcqId, revisionId: item.revisionId,
          subject: item.subject, chapter: item.chapter, topic: item.topic,
          source: item.source, question: item.question, options: item.options,
          correctIndex: item.correctIndex, explanation: item.explanation,
          mnemonic: item.mnemonic
        };
      });
      if (new Set(questions.map(q => q.id)).size !== questions.length ||
          payload.items.filter(item => item.isCorrect).length !== Number(payload.attempt.correct))
        throw new Error('Saved review order or score could not be verified.');
      state.reviewPrevious = {
        questions: currentQuizList, answers: userAnswers,
        index: currentMcqIndex, wizardSelection
      };
      currentQuizList = questions;
      userAnswers = payload.items.map(item => item.selectedIndex);
      currentMcqIndex = 0;
      wizardSelection = { ...wizardSelection, testMode: payload.attempt.mode === 'timed' ? 'timed' : 'tutor' };
      enterExam(true, Number(payload.attempt.elapsedSeconds) || 0);
    }
  };
  // A refreshed /quiz/session stays on its route while auth and published
  // questions load. The account-scoped bridge then restores the test, or
  // safely returns the student to Create Test if recovery is unavailable.
  // No answers are written during MCQ interactions.
})();
