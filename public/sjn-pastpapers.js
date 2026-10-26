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
    { id: 'sindh', name: 'Sindh', icon: 'fa-map-location-dot', short: 'S' },
    { id: 'punjab', name: 'Punjab', icon: 'fa-map-location-dot', short: 'P' },
    { id: 'kpk', name: 'KPK', icon: 'fa-map-location-dot', short: 'K' },
    { id: 'balochistan', name: 'Balochistan', icon: 'fa-map-location-dot', short: 'B' },
    { id: 'federal', name: 'Federal', icon: 'fa-landmark', short: 'F' }
  ]);
  let activeRegion = null;

  function regionCard(region) {
    return `<button type="button" class="sjn-pp-region-card" data-sjn-paper-region="${region.id}" aria-label="Browse ${region.name} Past Papers">
      <span class="sjn-pp-region-icon" aria-hidden="true"><i class="fa-solid ${region.icon}"></i></span>
      <span class="sjn-pp-region-content">
        <span class="sjn-pp-region-title">${region.name}</span>
        <span class="sjn-pp-region-desc">MDCAT paper collection</span>
        <span class="sjn-pp-region-meta"><i class="fa-regular fa-clock" aria-hidden="true"></i> Papers coming soon</span>
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
        No question papers have been uploaded yet.</p>`;
  }

  function renderRegion(region) {
    root.innerHTML = `<nav class="sjn-pp-crumb" aria-label="Past Papers navigation">
        <button type="button" data-sjn-paper-back><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> All categories</button>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <span aria-current="page">${region.name}</span>
      </nav>
      <div class="sjn-pp-section-heading">
        <div><span class="sjn-pp-section-kicker">REGIONAL COLLECTION</span>
        <h3>${region.name} Past Papers</h3>
        <p>Browse original papers by year and examination name.</p></div>
        <span class="sjn-pp-total-cats">0 published papers</span>
      </div>
      <div class="sjn-pp-paper-grid">
      <article class="sjn-pp-paper-card" aria-label="Example ${region.name} MDCAT 2025 paper — not published">
        <div class="sjn-pp-paper-card-main">
          <div class="sjn-pp-paper-year">2025</div>
          <div class="sjn-pp-paper-detail">
            <span class="sjn-pp-paper-status"><i class="fa-solid fa-eye" aria-hidden="true"></i> Not published</span>
            <h4>${region.name} MDCAT 2025</h4>
            <p>Sample paper card. Questions have not been uploaded yet.</p>
          </div>
        </div>
        <div class="sjn-pp-paper-bottom">
          <span><i class="fa-solid fa-list-check" aria-hidden="true"></i> Questions not uploaded</span>
          <button type="button" class="sjn-pp-start" disabled title="No verified paper questions available yet">
            <i class="fa-solid fa-play" aria-hidden="true"></i> Start Paper
          </button>
        </div>
      </article>
      </div>
      <p class="sjn-pp-library-note"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
        No question papers have been uploaded yet.</p>`;
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
    const card = event.target.closest('[data-sjn-paper-region]');
    if (!card || !root.contains(card)) return;
    const region = regions.find(item => item.id === card.dataset.sjnPaperRegion);
    if (!region) return;
    activeRegion = region.id;
    render();
  });

  window.SJNPastPapers = Object.freeze({ render });
  render();
})();
