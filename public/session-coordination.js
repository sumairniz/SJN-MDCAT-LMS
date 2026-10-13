// One authenticated student per browser profile; no credentials in localStorage.
(function (global) {
  'use strict';
  const KEY = 'sjn_auth_change_v1';
  const LOCK = 'sjn_cookie_operations_v1';
  function withCookieLock(action) {
    if (global.navigator.locks && typeof global.navigator.locks.request === 'function') {
      return global.navigator.locks.request(LOCK, { mode: 'exclusive' }, action);
    }
    // Legacy browsers cannot lock tabs. Server identity checks still prevent
    // cross-student access; redundant refreshes may require a new login.
    return Promise.resolve().then(action);
  }
  function signal(type) {
    if (type !== 'login' && type !== 'logout') throw new Error('Invalid session event.');
    try {
      global.localStorage.setItem(KEY, JSON.stringify({
        type, at: Date.now(), nonce: Math.random().toString(36).slice(2)
      }));
    } catch (error) { console.warn('Cross-tab notification unavailable:', error); }
  }
  function subscribe(listener) {
    global.addEventListener('storage', event => {
      if (event.key !== KEY || !event.newValue) return;
      try {
        const data = JSON.parse(event.newValue);
        if (data.type === 'login' || data.type === 'logout') listener(data);
      } catch (_) { /* Never trust storage as authentication. */ }
    });
  }
  function status() {
    return global.fetch('/api/auth/session', {
      method: 'GET', credentials: 'same-origin', cache: 'no-store'
    });
  }
  global.SJNSessionCoord = { withCookieLock, signal, subscribe, status };
})(window);
