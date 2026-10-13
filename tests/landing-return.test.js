"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const html = fs.readFileSync(require("node:path").join(__dirname, "../public/landing.html"), "utf8");
const start = html.indexOf("    async function checkSavedSession() {");
const end = html.indexOf("\n    checkSavedSession();", start);
assert.ok(start > 0 && end > start, "Landing session restoration function must exist");
const restorationCode = html.slice(start, end);

async function runReturn({ legacy = false, status = 200, token = "valid", userId = "student-a",
  expiresAt = 9000000, bodyUser = { id: "student-a" }, failing = false,
  recentLogout = false, submitting = false } = {}) {
  const requests = [], redirects = [], errors = [];
  const storage = new Map(legacy ? [["sjn_auth_token", "legacy-token"]] : []);
  const body = { dataset: {} };
  const document = {
    body,
    getElementById: () => ({ textContent: "" })
  };
  const sessionStorage = {
    getItem: key => (key === "sjn_recent_logout" && recentLogout ? "1" : null),
    removeItem: () => {}
  };
  const localStorage = {
    getItem: key => storage.get(key) || null,
    removeItem: key => storage.delete(key)
  };
  const window = { location: { replace(path) { redirects.push(path); } } };
  const fetch = async (path, options) => {
    requests.push({path, method: options?.method || "GET"});
    if (failing) throw new Error("Network outage");
    if (path.includes("/auth/refresh")) return {
      status, ok: status === 200,
      json: async () => ({token, userId, expiresAt})
    };
    if (path.includes("/me")) return {
      status, ok: status === 200,
      json: async () => ({ user: bodyUser })
    };
    throw new Error("Unexpected endpoint: " + path);
  };
  const SJN_AUTH = {apiBase: "/api", dashboard: "/index.html", tokenKey: "sjn_auth_token"};
  const SJNSessionCoord = {withCookieLock: fn => fn()};
  function showGuestLanding() { body.dataset.sessionState = "guest"; }
  function showSessionError() { body.dataset.sessionError = "true"; }
  const ctx = {sessionStorage, localStorage, document, window, fetch,
    SJN_AUTH, SJNSessionCoord, authSubmitting: submitting,
    showGuestLanding, showSessionError,
    console: {warn: (...args) => errors.push(args)}};
  vm.runInNewContext(restorationCode + "\ncheckSavedSession();", ctx);
  await new Promise(resolve => setImmediate(resolve));
  return {requests, redirects, errors, body, storage};
}

test("returning cookie-backed student sees a branded, inline-styled status before JS", () => {
  const loadingMarkup = html.match(/<div id="session-check"[\s\S]*?<\/div>/)?.[0] || "";
  assert.match(loadingMarkup, /Restoring your session/);
  assert.match(loadingMarkup, /id="session-check-spinner"/);
  assert.match(html, /#session-check \{ display: none; position: fixed/);
  assert.match(html, /body\[data-session-state="checking"\] #session-check \{ display: flex; \}/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
});

test("valid returning session redirects after refresh without redundant /me", async () => {
  const out = await runReturn();
  assert.deepEqual(out.requests.map(x => x.path), ["/api/auth/refresh"]);
  assert.deepEqual(out.redirects, ["/index.html"]);
  assert.equal(out.body.dataset.sessionState, undefined);
});

test("expired cookie allows guest landing, never dashboard", async () => {
  const out = await runReturn({status:401});
  assert.deepEqual(out.requests.map(x => x.path), ["/api/auth/refresh"]);
  assert.deepEqual(out.redirects, []);
  assert.equal(out.body.dataset.sessionState, "guest");
});

test("incomplete refresh response fails closed with visible retry", async () => {
  const out = await runReturn({userId: ""});
  assert.equal(out.redirects.length, 0);
  assert.equal(out.body.dataset.sessionError, "true");
});

test("connection failure displays retry and cannot reveal a student's dashboard", async () => {
  const out = await runReturn({failing:true});
  assert.equal(out.redirects.length, 0);
  assert.equal(out.body.dataset.sessionError, "true");
});

test("manual recent logout bypasses all refresh and opens guest landing", async () => {
  const out = await runReturn({recentLogout:true});
  assert.deepEqual(out.requests, []);
  assert.deepEqual(out.redirects, []);
  assert.equal(out.body.dataset.sessionState, "guest");
});

test("legacy access token still verifies student through /me", async () => {
  const out = await runReturn({legacy:true});
  assert.deepEqual(out.requests.map(x => x.path), ["/api/me"]);
  assert.deepEqual(out.redirects, ["/index.html"]);
});

test("legacy mismatched identity is not allowed into dashboard", async () => {
  const out = await runReturn({legacy:true,bodyUser:null});
  assert.deepEqual(out.redirects, []);
  assert.equal(out.body.dataset.sessionError, "true");
});

test("in-progress manual authentication blocks session restore redirect", async () => {
  const out = await runReturn({submitting:true});
  assert.deepEqual(out.redirects, []);
});
