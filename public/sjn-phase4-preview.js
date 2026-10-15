/* SJN Phase 4 — staged SPA exam workspace.
 * Opt-in on development/staging via ?sjnPhase4Preview=1.
 * Until secure draft persistence is shipped, the existing quiz flow remains
 * the default. This module does NOT claim Save & Exit or recovery support.
 */
(() => {
  'use strict';
  const search = new URLSearchParams(window.location.search);
  if (search.get('sjnPhase4Preview') !== '1') return;

  const $ = (id) => document.getElementById(id);
  const EXAM_URL = '/quiz/session?sjnPhase4Preview=1';
  const HOME_URL = '/index.html?sjnPhase4Preview=1';
  const state = {
    open: false, navigatorOpen: true, checked: [], seconds: 0,
    startedAt: 0, interval: null, ending: false, modal: null
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
              <legend class="sjn-exam-report-legend">Select one reason</legend>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="wrong-answer-key"><i class="fa-solid fa-key" aria-hidden="true"></i><span>Wrong answer key</span></label>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="question-statement-error"><i class="fa-solid fa-file-circle-exclamation" aria-hidden="true"></i><span>Question statement error</span></label>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="incorrect-option"><i class="fa-solid fa-list-ul" aria-hidden="true"></i><span>Incorrect option</span></label>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="wrong-explanation"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Wrong explanation</span></label>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="missing-explanation"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i><span>Missing explanation</span></label>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="typo-spelling"><i class="fa-solid fa-pencil" aria-hidden="true"></i><span>Typo / spelling error</span></label>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="ambiguous-wording"><i class="fa-regular fa-circle-question" aria-hidden="true"></i><span>Ambiguous wording</span></label>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="duplicate-question"><i class="fa-regular fa-copy" aria-hidden="true"></i><span>Duplicate question</span></label>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="outdated-information"><i class="fa-regular fa-calendar" aria-hidden="true"></i><span>Outdated information</span></label>
              <label class="sjn-exam-report-reason"><input type="radio" name="sjn-report-reason" value="technical-issue"><i class="fa-solid fa-gear" aria-hidden="true"></i><span>Technical issue</span></label>
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
  const marked = (q) => bookmarkedMcqs.some(id => String(id) === String(q.id));

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
      button.className = action.primary ? 'sjn-exam-dialog-primary' : 'sjn-exam-secondary';
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
      const isTutor = wizardSelection.testMode !== 'timed';
      let status = selected === null ? 'unanswered' : isTutor && state.checked[i] ? selected === q.correctIndex ? 'correct' : 'incorrect' : 'answered';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sjn-exam-number is-' + status + (i === currentMcqIndex ? ' is-current' : '') + (marked(q) ? ' is-marked' : '');
      button.textContent = String(i + 1);
      button.setAttribute('aria-label', 'Question ' + (i + 1) + ', ' + status + (marked(q) ? ', marked' : ''));
      if (i === currentMcqIndex) button.setAttribute('aria-current', 'step');
      button.addEventListener('click', () => goTo(i));
      area.appendChild(button);
    });
    const correct = currentQuizList.reduce((n, q, i) => n + (state.checked[i] && userAnswers[i] === q.correctIndex ? 1 : 0), 0);
    const incorrect = currentQuizList.reduce((n, q, i) => n + (state.checked[i] && userAnswers[i] !== null && userAnswers[i] !== q.correctIndex ? 1 : 0), 0);
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
    // Keep the existing SJN chapter/topic treatment: plain muted text, not new colored pills.
    $('sjn-exam-chapter').textContent = (q.chapter || 'Chapter') + '  |  ' + (q.topic || 'General Topic');
    const src = $('sjn-exam-source-row');
    src.replaceChildren();
    if (q.source) {
      const b = document.createElement('span');
      b.className = 'sjn-exam-source';
      b.textContent = q.source;
      src.append(b);
    }
    const markBtn = $('sjn-exam-mark');
    markBtn.setAttribute('aria-pressed', String(marked(q)));
    markBtn.classList.toggle('is-marked', marked(q));
    markBtn.querySelector('i').className = (marked(q) ? 'fa-solid' : 'fa-regular') + ' fa-bookmark';
    const options = $('sjn-exam-options'); options.replaceChildren();
    const isTutor = wizardSelection.testMode !== 'timed';
    const checked = isTutor && state.checked[currentMcqIndex];
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
        if (checked) return;
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
    dialog('Exit this practice test?', 'Save & Exit is not yet available in this staged preview. Leaving now discards this unfinished attempt. Choose Cancel to keep your answers.', [
      { label: 'Cancel', run() {} },
      { label: 'Exit Without Saving', run: leaveUnsaved, primary: true }
    ]);
  }
  function completeTest() {
    if (!state.open || state.ending) return;
    state.ending = true;
    closeExam();
    setURL(HOME_URL, true);
    // This is the existing authenticated save pipeline; do not bypass the
    // server's student-ID and 24-hour session checks.
    Promise.resolve(window.finishQuiz()).finally(() => { state.ending = false; });
  }
  function requestSubmission() {
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
  function enterExam() {
    if (!currentQuizList.length || state.open) return;
    state.open = true; state.ending = false;
    state.checked = Array(currentQuizList.length).fill(false);
    state.navigatorOpen = true;
    $('sjn-exam-mode').textContent = wizardSelection.testMode === 'timed' ? 'Timed' : 'Tutor';
    document.querySelectorAll('.module-view').forEach(view => view.classList.add('hidden'));
    stage.classList.remove('hidden');
    document.body.classList.add('sjn-phase4-exam-active');
    $('sjn-exam-layout').classList.remove('nav-hidden');
    $('sjn-exam-nav-backdrop').classList.add('hidden');
    $('sjn-exam-nav-toggle').setAttribute('aria-expanded', 'true');
    if (isMobile()) closeNavigator();
    setURL(EXAM_URL);
    startClock();
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
    reportLayer.querySelector('input[type="radio"]')?.focus();
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
  $('sjn-exam-mark').addEventListener('click', async () => {
    const before = currentQuizList[currentMcqIndex]?.id;
    await window.toggleBookmarkCurrentMcq();
    if (before === currentQuizList[currentMcqIndex]?.id) renderQuestion();
  });
  window.addEventListener('beforeunload', (e) => {
    if (!state.open) return;
    e.preventDefault(); e.returnValue = '';
  });
  window.addEventListener('popstate', () => {
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
    }
  };
  // Direct entry or refresh cannot reconstruct an attempt until draft
  // persistence is built. Never show a false recovered/unsaved exam.
  if (window.location.pathname === '/quiz/session') {
    setURL(HOME_URL, true);
    window.addEventListener('DOMContentLoaded', () => {
      const message = document.createElement('p');
      message.className = 'sjn-exam-preview-note';
      message.textContent = 'Your previous preview test cannot be restored yet. Please create a new practice test.';
      const wizard = $('module-wizard');
      if (wizard) wizard.prepend(message);
      // Existing session guard still verifies identity before revealing UI.
      switchModule('wizard');
    }, { once: true });
  }
})();
