/* TEMP-P4-001 — staging only: preserve explicit Phase 4 preview opt-in across auth routes.
 * Reject arbitrary redirect targets, share tokens and query parameters. Remove when
 * the approved Phase 4 exam becomes the ordinary (non-preview) LMS flow.
 */
(function (root) {
  'use strict';
  const allowed = new Set(['/landing.html', '/index.html']);
  root.SJNPreviewAuthRoute = Object.freeze({
    to(path) {
      if (!allowed.has(path)) throw new TypeError('Unexpected authentication route');
      return path + (new URLSearchParams(root.location.search).get('sjnPhase4Preview') === '1'
        ? '?sjnPhase4Preview=1' : '');
    }
  });
})(window);
