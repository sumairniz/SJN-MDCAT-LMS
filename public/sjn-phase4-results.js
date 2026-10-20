/* SJN Phase 4 Stage 3A — approved results presentation, opt-in preview only.
 * Stage 3C historical question records enable verified Results Screen review
 * and retake. No browser storage of test answers or unauthorized score writes.
 */
(() => {
  'use strict';
  if (new URLSearchParams(window.location.search).get('sjnPhase4Preview') !== '1') return;

  const RESULTS_URL = '/quiz/results?sjnPhase4Preview=1';
  const HOME_URL = '/index.html?sjnPhase4Preview=1';
  const RADIUS = 68;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  function summarizeAttempt(questions, answers, elapsedSeconds) {
    const list = Array.isArray(questions) ? questions : [];
    const given = Array.isArray(answers) ? answers : [];
    const maps = { subjects: new Map(), chapters: new Map(), topics: new Map() };
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    function add(map, label, hit) {
      let row = map.get(label);
      if (!row) { row = { label, total: 0, correct: 0 }; map.set(label, row); }
      row.total++;
      if (hit) row.correct++;
    }

    list.forEach((question, index) => {
      const q = question || {};
      const selected = given[index];
      const unanswered = selected === null || selected === undefined;
      const hit = !unanswered && selected === q.correctIndex;
      if (unanswered) skipped++;
      else if (hit) correct++;
      else incorrect++;

      const subject = String(q.subject || 'General');
      const chapter = String(q.chapter || 'General Chapter');
      const topic = String(q.topic || 'General Topic');
      add(maps.subjects, subject, hit);
      add(maps.chapters, subject + ' · ' + chapter, hit);
      add(maps.topics, subject + ' · ' + chapter + ' · ' + topic, hit);
    });

    const total = list.length;
    const accuracy = total ? Math.round(100 * correct / total) : 0;
    const groups = {};
    for (const [name, map] of Object.entries(maps)) {
      groups[name] = [...map.values()].map(row => ({
        ...row,
        accuracy: row.total ? Math.round(100 * row.correct / row.total) : 0
      }));
    }
    return {
      total, correct, incorrect, skipped, accuracy,
      elapsedSeconds: Number.isFinite(elapsedSeconds) ? Math.max(0, Math.floor(elapsedSeconds)) : 0,
      groups
    };
  }

  function accuracyBand(accuracy) {
    return accuracy >= 80 ? 'green' : accuracy >= 50 ? 'yellow' : 'red';
  }

  function formatDuration(seconds) {
    const n = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const units = [Math.floor(n / 3600), Math.floor(n / 60) % 60, n % 60];
    return units[0] > 0
      ? String(units[0]) + ':' + String(units[1]).padStart(2, '0') + ':' + String(units[2]).padStart(2, '0')
      : String(units[1]) + ':' + String(units[2]).padStart(2, '0');
  }

  const workspace = document.querySelector('main');
  if (!workspace) return;
  const section = document.createElement('section');
  section.id = 'sjn-results-preview';
  section.className = 'module-view hidden sjn-results-workspace';
  section.setAttribute('aria-label', 'Completed practice test results');
  section.innerHTML = [
    '<div class="sjn-results-container">',
    '  <div class="sjn-results-heading">',
    '    <h1>Practice Test Completed!</h1>',
    '    <p>Here is your performance summary report.</p>',
    '  </div>',
    '  <div class="sjn-results-ring-wrap">',
    '    <div class="sjn-results-ring is-red" id="sjn-results-ring">',
    '      <svg viewBox="0 0 180 180" role="img" aria-label="Accuracy progress" id="sjn-results-ring-svg">',
    '        <defs>',
    '          <pattern id="sjn-results-rope-pattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-36)">',
    '            <path d="M1 0 V10" stroke="#fff" stroke-opacity=".32" stroke-width="2.8"/>',
    '            <path d="M6 0 V10" stroke="#04110a" stroke-opacity=".38" stroke-width="2.5"/>',
    '          </pattern>',
    '          <filter id="sjn-results-soft-glow" x="-25%" y="-25%" width="150%" height="150%">',
    '            <feGaussianBlur stdDeviation="2.4"/>',
    '          </filter>',
    '        </defs>',
    '        <circle class="sjn-results-ring-track" cx="90" cy="90" r="68"/>',
    '        <circle class="sjn-results-ring-glow" id="sjn-results-ring-glow" cx="90" cy="90" r="68"/>',
    '        <circle class="sjn-results-ring-progress" id="sjn-results-ring-progress" cx="90" cy="90" r="68"/>',
    '        <circle class="sjn-results-ring-braid" id="sjn-results-ring-braid" cx="90" cy="90" r="68"/>',
    '      </svg>',
    '      <div class="sjn-results-ring-text">',
    '        <strong id="sjn-results-accuracy">0%</strong>',
    '        <span>ACCURACY</span>',
    '      </div>',
    '    </div>',
    '    <p class="sjn-results-score" id="sjn-results-score">0 / 0</p>',
    '  </div>',
    '  <div class="sjn-results-stats" aria-label="Test statistics">',
    '    <div class="sjn-results-stat is-correct">',
    '      <div class="sjn-results-stat-head"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>Correct</span></div>',
    '      <strong id="sjn-results-correct">0</strong>',
    '    </div>',
    '    <div class="sjn-results-stat is-incorrect">',
    '      <div class="sjn-results-stat-head"><i class="fa-solid fa-circle-xmark" aria-hidden="true"></i><span>Incorrect</span></div>',
    '      <strong id="sjn-results-incorrect">0</strong>',
    '    </div>',
    '    <div class="sjn-results-stat is-skipped">',
    '      <div class="sjn-results-stat-head"><i class="fa-solid fa-circle-minus" aria-hidden="true"></i><span>Skipped</span></div>',
    '      <strong id="sjn-results-skipped">0</strong>',
    '    </div>',
    '    <div class="sjn-results-stat is-time">',
    '      <div class="sjn-results-stat-head"><i class="fa-solid fa-clock" aria-hidden="true"></i><span>Time Taken</span></div>',
    '      <strong id="sjn-results-time">0:00</strong>',
    '      <span class="sjn-results-time-units" id="sjn-results-time-units">M:S</span>',
    '    </div>',
    '  </div>',
    '  <div class="sjn-results-actions">',
    '    <button type="button" class="is-primary" id="sjn-results-review" disabled title="Available after verified test saving"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>Review Answers</button>',
    '    <button type="button" id="sjn-results-retake" disabled title="Available after verified test saving"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i>Retake Test</button>',
    '    <button type="button" id="sjn-results-dashboard"><i class="fa-solid fa-house" aria-hidden="true"></i>Return to Dashboard</button>',
    '    <button type="button" id="sjn-results-new-test"><i class="fa-solid fa-plus-circle" aria-hidden="true"></i>Create New Test</button>',
    '  </div>',
    '  <details class="sjn-results-insights" id="sjn-results-insights">',
    '    <summary><span><i class="fa-solid fa-chart-simple" aria-hidden="true"></i> Performance Insights</span><i class="fa-solid fa-chevron-down sjn-results-insights-chevron" aria-hidden="true"></i></summary>',
    '    <div id="sjn-results-insights-body" class="sjn-results-insights-body"></div>',
    '  </details>',
    '</div>'
  ].join('');
  workspace.append(section);

  const $ = id => document.getElementById(id);
  let visible = false;
  let pendingSave = false;
  let verifiedAttemptId = null;
  let openingAction = false;
  let showVersion = 0;

  function makeInsights(groups) {
    const holder = $('sjn-results-insights-body');
    holder.replaceChildren();
    const sets = [
      ['Subject-wise Performance', groups.subjects],
      ['Chapter-wise Performance', groups.chapters],
      ['Topic-wise Performance', groups.topics]
    ];
    for (const [heading, rows] of sets) {
      if (!rows || !rows.length) continue;
      const area = document.createElement('section');
      area.className = 'sjn-results-insight-group';
      const h = document.createElement('h2');
      h.textContent = heading;
      area.append(h);
      rows.forEach(item => {
        const row = document.createElement('div');
        row.className = 'sjn-results-insight-item';
        const header = document.createElement('div');
        header.className = 'sjn-results-insight-line';
        const label = document.createElement('span');
        label.textContent = item.label;
        const score = document.createElement('strong');
        score.textContent = item.correct + ' / ' + item.total + '  ·  ' + item.accuracy + '%';
        header.append(label, score);
        const track = document.createElement('div');
        track.className = 'sjn-results-insight-track';
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-label', item.label + ' accuracy');
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(item.accuracy));
        const fill = document.createElement('div');
        fill.className = 'sjn-results-insight-fill is-' + accuracyBand(item.accuracy);
        fill.style.width = item.accuracy + '%';
        track.append(fill);
        row.append(header, track);
        area.append(row);
      });
      holder.append(area);
    }
  }

  function hide() {
    visible = false;
    document.body.classList.remove('sjn-phase4-results-active');
    section.classList.add('hidden');
  }

  function navigateTo(moduleName) {
    if (pendingSave || openingAction) return;
    hide();
    window.history.replaceState({ sjnPhase4Preview: true }, '', HOME_URL);
    switchModule(moduleName);
    workspace.scrollTop = 0;
  }

  // Read immutable, student-owned history before opening either Results action.
  // History Review keeps its own approved UI; ONLY this button reuses the exam.
  async function openSavedAction(kind) {
    if (!visible || pendingSave || openingAction || !verifiedAttemptId) return;
    const attemptId = verifiedAttemptId;
    const version = showVersion;
    openingAction = true;
    $('sjn-results-review').disabled = true;
    $('sjn-results-retake').disabled = true;
    try {
      if (typeof window.SJNHistoryFetchAttempt !== 'function')
        throw new Error('Saved test history is not ready. Please reload the LMS.');
      const payload = await window.SJNHistoryFetchAttempt(attemptId);
      if (!visible || version !== showVersion || attemptId !== verifiedAttemptId) return;
      if (!payload?.attempt || payload.attempt.id !== attemptId ||
          payload.reviewAvailable !== true || payload.retakeAvailable !== true ||
          !Array.isArray(payload.items) || payload.items.length !== Number(payload.attempt.total))
        throw new Error('This completed test does not have verified question-level history.');
      if (kind === 'review') {
        if (typeof window.SJNPhase4Exam?.reviewSavedAttempt !== 'function')
          throw new Error('The examination review workspace is not ready.');
        window.SJNPhase4Exam.reviewSavedAttempt(payload);
      } else {
        if (typeof window.SJNHistoryLaunchRetake !== 'function')
          throw new Error('Retake is not ready. Please reload the LMS.');
        await window.SJNHistoryLaunchRetake(payload);
        if (window.SJNPhase4Exam?.isOpen?.() !== true)
          throw new Error('The new attempt could not be opened. Please try again.');
      }
      // The existing exam renderer owns its questions, navigation and styles.
      hide();
    } catch (error) {
      window.alert(error?.message || 'Unable to open this saved test.');
    } finally {
      openingAction = false;
      const enabled = visible && !pendingSave && !!verifiedAttemptId;
      $('sjn-results-review').disabled = !enabled;
      $('sjn-results-retake').disabled = !enabled;
    }
  }

  $('sjn-results-review').addEventListener('click', () => void openSavedAction('review'));
  $('sjn-results-retake').addEventListener('click', () => void openSavedAction('retake'));
  $('sjn-results-dashboard').addEventListener('click', () => navigateTo('dashboard'));
  $('sjn-results-new-test').addEventListener('click', () => navigateTo('wizard'));
  window.addEventListener('popstate', () => {
    if (!visible || window.location.pathname === '/quiz/results') return;
    hide();
    // Back never reopens an unsaved test or a completed record as a draft.
    switchModule('wizard');
  });

  function restoreAfterReview() {
    // Only a results view already opened for the verified attempt can return.
    if (!verifiedAttemptId || pendingSave || openingAction) return;
    document.querySelectorAll('.module-view').forEach(view => view.classList.add('hidden'));
    section.classList.remove('hidden');
    visible = true;
    document.body.classList.add('sjn-phase4-results-active');
    window.history.replaceState({ sjnPhase4Preview: true }, '', RESULTS_URL);
    workspace.scrollTop = 0;
  }

  function show(snapshot, savePromise) {
    const version = ++showVersion;
    verifiedAttemptId = null;
    openingAction = false;
    const report = summarizeAttempt(snapshot.questions, snapshot.answers, snapshot.elapsedSeconds);
    const ring = $('sjn-results-ring');
    const band = accuracyBand(report.accuracy);
    ring.className = 'sjn-results-ring is-' + band;
    const dash = String(CIRCUMFERENCE * report.accuracy / 100) + ' ' + String(CIRCUMFERENCE);
    for (const id of ['sjn-results-ring-progress', 'sjn-results-ring-braid', 'sjn-results-ring-glow']) {
      $(id).style.strokeDasharray = dash;
    }
    $('sjn-results-ring-svg').setAttribute('aria-label', 'Accuracy: ' + report.accuracy + ' percent');
    $('sjn-results-accuracy').textContent = report.accuracy + '%';
    $('sjn-results-score').textContent = report.correct + ' / ' + report.total;
    $('sjn-results-correct').textContent = String(report.correct);
    $('sjn-results-incorrect').textContent = String(report.incorrect);
    $('sjn-results-skipped').textContent = String(report.skipped).padStart(2, '0');
    $('sjn-results-time').textContent = formatDuration(report.elapsedSeconds);
    $('sjn-results-time-units').textContent = report.elapsedSeconds >= 3600 ? 'H:M:S' : 'M:S';
    $('sjn-results-insights').open = false;
    makeInsights(report.groups);

    // Keep secure background saving, but do not show a transient yellow
    // Saving message or leave a blank reserved status row in the results UI.
    pendingSave = true;
    $('sjn-results-review').disabled = true;
    $('sjn-results-retake').disabled = true;
    $('sjn-results-dashboard').disabled = true;
    $('sjn-results-new-test').disabled = true;
    document.querySelectorAll('.module-view').forEach(view => view.classList.add('hidden'));
    section.classList.remove('hidden');
    visible = true;
    document.body.classList.add('sjn-phase4-results-active');
    window.history.replaceState({ sjnPhase4Preview: true }, '', RESULTS_URL);
    workspace.scrollTop = 0;

    // The single authenticated /api/practice/submit path remains the writer.
    // The score is displayed immediately; persistence confirms asynchronously.
    // Actual save failures remain visible via the authenticated saver's alert.
    Promise.resolve(savePromise).then(outcome => {
      if (!visible || showVersion !== version) return;
      const confirmed = outcome && outcome.saved === true &&
        Number.isSafeInteger(outcome.id) && outcome.id > 0;
      verifiedAttemptId = confirmed ? outcome.id : null;
      const mismatch = confirmed && (
        outcome.total !== report.total ||
        outcome.correct !== report.correct ||
        outcome.incorrect !== report.incorrect ||
        outcome.skipped !== report.skipped
      );
      if (mismatch) {
        // Never present a provisional browser-calculated result as the
        // authoritative saved score. The database result always wins.
        const serverPercent = Math.round(outcome.accuracy);
        $('sjn-results-score').textContent = outcome.correct + ' / ' + outcome.total;
        $('sjn-results-correct').textContent = String(outcome.correct);
        $('sjn-results-incorrect').textContent = String(outcome.incorrect);
        $('sjn-results-skipped').textContent = String(outcome.skipped).padStart(2, '0');
        $('sjn-results-accuracy').textContent = serverPercent + '%';
        $('sjn-results-ring-svg').setAttribute('aria-label', 'Accuracy: ' + serverPercent + ' percent');
        ring.className = 'sjn-results-ring is-' + accuracyBand(serverPercent);
        const serverDash = String(CIRCUMFERENCE * serverPercent / 100) + ' ' + String(CIRCUMFERENCE);
        for (const id of ['sjn-results-ring-progress', 'sjn-results-ring-braid', 'sjn-results-ring-glow']) {
          $(id).style.strokeDasharray = serverDash;
        }
        $('sjn-results-insights').open = false;
        $('sjn-results-insights').hidden = true;
      } else {
        $('sjn-results-insights').hidden = false;
      }
      // No green success banner: completed results stay clean, while the
      // verified grade and Test History are still updated behind the scenes.
      // The saver reports ordinary failed saves, including network errors.
    }).catch(() => {
      if (!visible || showVersion !== version) return;
      // Unexpected rejected promises are rare, but must never silently lose
      // a student's result merely to keep the normal interface minimal.
      window.alert('Your completed test could not be confirmed as saved. Check Test History before trying again.');
    }).finally(() => {
      if (showVersion !== version) return;
      pendingSave = false;
      $('sjn-results-review').disabled = !verifiedAttemptId;
      $('sjn-results-retake').disabled = !verifiedAttemptId;
      const message = verifiedAttemptId ? 'Open the securely saved test' :
        'Unavailable because saving could not be verified. Check Test History.';
      $('sjn-results-review').title = message;
      $('sjn-results-retake').title = message;
      $('sjn-results-dashboard').disabled = false;
      $('sjn-results-new-test').disabled = false;
    });
  }

  // A refreshed direct /quiz/results URL is not a saved attempt; never
  // synthesize historical details from stale browser memory.
  if (window.location.pathname === '/quiz/results') {
    window.history.replaceState({ sjnPhase4Preview: true }, '', HOME_URL);
    window.addEventListener('DOMContentLoaded', () => {
      if (typeof switchModule === 'function') switchModule('wizard');
    }, { once: true });
  }
  window.SJNPhase4Results = { show, restoreAfterReview };
})();