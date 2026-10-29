/* SJN MDCAT LMS Pro — Past Papers pre-attempt browser (staging preview).
 * This module NEVER creates a test, publishes a question, reads a PDF, or
 * treats illustrative paper cards as real published content.
 * The existing authenticated exam renderer remains the only quiz interface.
 */
(() => {
  'use strict';
  const root = document.getElementById('sjn-pastpapers-root');
  if (!root) return;

  const regions = Object.freeze([
    { id: 'sindh', name: 'Sindh' },
    { id: 'punjab', name: 'Punjab' },
    { id: 'kpk', name: 'KPK' },
    { id: 'balochistan', name: 'Balochistan' },
    { id: 'federal', name: 'Federal' }
  ]);
  // Fixed simple vector silhouettes inspired by landmarks. They are not
  // exact architectural plans, government seals or external image assets.
  const symbols = Object.freeze({
    sindh: '<path d="M9 54H55 M16 54V31L23 20H41L48 31V54 M16 31H48 M23 20L28 14H36L41 20 M27 54V39H37V54"/>',
    punjab: '<path d="M32 7V14 M26 16H38L36 22H28L26 16Z M28 22L25 35H39L36 22 M25 35L20 46H44L39 35 M17 49H47 M13 54H51 M20 54V49 M44 54V49"/>',
    kpk: '<path d="M8 54H56 M12 54V27L20 19H44L52 27V54 M12 28H52 M24 54V40Q32 29 40 40V54 M19 33V38 M45 33V38"/>',
    balochistan: '<path d="M6 52L20 32L28 40L38 19L58 52 M15 52L23 42L29 47 M32 29L38 19L46 30 M7 56H57"/>',
    federal: '<path d="M7 23L32 10L57 23H7Z M11 28H53 M15 28V47 M23 28V47 M30 28V47 M39 28V47 M47 28V47 M10 51H54 M7 55H57"/>'
  });
  function regionSymbol(region) {
    return `<svg class="sjn-pp-symbol" viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${symbols[region.id]}</svg>`;
  }
  let activeRegion = null;
  let publishedPapers = [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function setPapers(rows) {
    publishedPapers = Array.isArray(rows) ? rows.filter(p =>
      regions.some(r=>r.id===p.region) && Number.isSafeInteger(Number(p.id)) &&
      Array.isArray(p.mcqIds) && p.mcqIds.length>0 && p.mcqIds.length<=200 &&
      typeof p.title==='string') : [];
  }
  const inRegion = region => publishedPapers.filter(p=>p.region===region.id);


  function regionCard(region) {
    return `<button type="button" class="sjn-pp-region-card" data-sjn-paper-region="${region.id}" aria-label="Browse ${region.name} Past Papers">
      <span class="sjn-pp-region-icon" aria-hidden="true">${regionSymbol(region)}</span>
      <span class="sjn-pp-region-content">
        <span class="sjn-pp-region-title">${region.name}</span>
        <span class="sjn-pp-region-desc">MDCAT paper collection</span>
        <span class="sjn-pp-region-meta"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${inRegion(region).length ? inRegion(region).length+' published paper(s)' : 'Papers coming soon'}</span>
      </span>
      <i class="fa-solid fa-arrow-right sjn-pp-region-arrow" aria-hidden="true"></i>
    </button>`;
  }

  function renderHome() {
    root.innerHTML = `<div class="sjn-pp-section-heading">
        <div><span class="sjn-pp-section-kicker">BROWSE BY REGION</span><h3>Select a category</h3>
        <p>Choose a region to explore its year-wise examination papers.</p></div>
        <span class="sjn-pp-total-cats">5 categories</span>
      </div>
      <div class="sjn-pp-region-grid">${regions.map(regionCard).join('')}</div>
      <p class="sjn-pp-library-note"><i class="fa-solid fa-circle-info" aria-hidden="true"></i>
        ${publishedPapers.length ? publishedPapers.length+' paper(s) published.' : 'No question papers have been uploaded yet.'}</p>`;
  }


  // Paper visual identity inherits the exact approved parent-region accent and landmark.
  function publishedCard(p) {
    const id=Number(p.id);
    const region=regions.find(item=>item.id===p.region);
    return `<article class="sjn-pp-paper-card is-published" aria-label="${esc(p.title)}">
      <div class="sjn-pp-paper-topline">
        <span class="sjn-pp-paper-identity">
          <span class="sjn-pp-paper-emblem" aria-hidden="true">${regionSymbol(region)}</span>
          <span>${esc(region.name)} Past Papers</span>
        </span>
        <span class="sjn-pp-paper-status is-published"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Published</span>
      </div>
      <div class="sjn-pp-paper-card-main">
        <div class="sjn-pp-paper-year">
          <small class="sjn-pp-paper-year-caption">YEAR</small><strong>${esc(p.year)}</strong>
        </div>
        <div class="sjn-pp-paper-detail">
          <h4>${esc(p.title)}</h4>
          <p>${esc(p.description || 'Original MDCAT past paper')}</p>
        </div>
      </div>
      <div class="sjn-pp-paper-bottom">
        <span class="sjn-pp-paper-count"><i class="fa-solid fa-list-check" aria-hidden="true"></i> ${p.mcqIds.length} Questions</span>
        <button type="button" class="sjn-pp-start" data-sjn-paper-choose="${id}"
          aria-label="Start ${esc(p.title)}" aria-expanded="false" aria-controls="sjn-pp-modes-${id}">
          <span>Start Paper</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
      <div class="sjn-pp-modes" id="sjn-pp-modes-${id}" hidden>
        <p>Choose how to attempt this paper</p>
        <div class="sjn-pp-mode-actions">
          <button type="button" data-sjn-paper-mode="tutor" data-sjn-paper-id="${id}">Tutor Mode</button>
          <button type="button" data-sjn-paper-mode="timed" data-sjn-paper-id="${id}">Timed Mode</button>
        </div>
      </div>
    </article>`;
  }

  function previewCard(region) {
    return `<article class="sjn-pp-paper-card" aria-label="Example ${region.name} MDCAT 2025 paper — not published">
      <div class="sjn-pp-paper-card-main">
        <div class="sjn-pp-paper-year">2025</div>
        <div class="sjn-pp-paper-detail">
          <span class="sjn-pp-paper-status">Not published</span>
          <h4>${region.name} MDCAT 2025</h4>
          <p>Sample paper card. Questions have not been uploaded yet.</p>
        </div>
      </div>
      <div class="sjn-pp-paper-bottom">
        <span>Questions not uploaded</span>
        <button type="button" class="sjn-pp-start" disabled title="No verified paper questions available yet">Start Paper</button>
      </div>
    </article>`;
  }

  function renderRegion(region) {
    const papers=inRegion(region);
    root.innerHTML=`<div class="sjn-pp-region-view" data-sjn-paper-theme="${region.id}">
      <nav class="sjn-pp-crumb" aria-label="Past Papers navigation">
        <button type="button" data-sjn-paper-back><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> All categories</button>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <span aria-current="page">${region.name}</span>
      </nav>
      <div class="sjn-pp-section-heading">
        <div><span class="sjn-pp-section-kicker">REGIONAL COLLECTION</span>
        <div class="sjn-pp-collection-name">
          <span class="sjn-pp-collection-symbol" aria-hidden="true">${regionSymbol(region)}</span>
          <h3>${region.name} Past Papers</h3>
        </div>
        <p>Browse original papers by year and examination name.</p></div>
        <span class="sjn-pp-total-cats">${papers.length} published papers</span>
      </div>
      <div class="sjn-pp-paper-grid">${papers.length ? papers.map(publishedCard).join('') : previewCard(region)}</div>
      ${papers.length ? '' : '<p class="sjn-pp-library-note">No question papers have been uploaded yet.</p>'}
    </div>`;
  }

  function render() {
    const region = regions.find(item => item.id === activeRegion);
    if (region) renderRegion(region);
    else renderHome();
  }

  // One delegated handler: category cards and back navigation are both
  // keyboard-accessible buttons. Sample Start Paper is disabled by HTML.
  root.addEventListener('click', event => {
    const back = event.target.closest('[data-sjn-paper-back]');
    if (back && root.contains(back)) {
      activeRegion = null;
      render();
      return;
    }
    const mode=event.target.closest('[data-sjn-paper-mode]');
    if(mode && root.contains(mode)){
      const id=Number(mode.dataset.sjnPaperId);
      if(publishedPapers.some(p=>Number(p.id)===id && p.region===activeRegion))
        window.SJNStartPublishedPaper?.(id,mode.dataset.sjnPaperMode);
      return;
    }
    const start=event.target.closest('[data-sjn-paper-choose]');
    if(start && root.contains(start)){
      const panel=root.querySelector('#sjn-pp-modes-'+Number(start.dataset.sjnPaperChoose));
      if(panel){panel.hidden=!panel.hidden;start.setAttribute('aria-expanded',String(!panel.hidden));}
      return;
    }
    const card = event.target.closest('[data-sjn-paper-region]');
    if (!card || !root.contains(card)) return;
    const region = regions.find(item => item.id === card.dataset.sjnPaperRegion);
    if (!region) return;
    activeRegion = region.id;
    render();
  });

  window.SJNPastPapers = Object.freeze({ render, setPapers });
  render();
})();
