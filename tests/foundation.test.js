"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key";

const databaseCalls = [];
let failBookmarkInsert = false;

function makeQuery(table, authorization) {
  const filters = {};
  let action = "select";
  function result(kind) {
    databaseCalls.push({ table, authorization, filters: { ...filters }, action });
    if (table === "profiles") return { data: { name: "Student", role: "student" }, error: null };
    if (table === "attempts") return { data: kind === "single" ? { id: 42 } : [{ total: 5, correct: 3 }], error: null };
    if (table === "bookmarks") {
      if (action === "insert" && failBookmarkInsert) return { data: null, error: { code: "23503" } };
      return { data: kind === "maybeSingle" ? null : [], error: null };
    }
    return { data: [], error: null };
  }
  const q = {
    select() { return q; },
    eq(key, val) { filters[key] = val; return q; },
    order() { return q; },
    insert() { action = "insert"; return q; },
    delete() { action = "delete"; return q; },
    single() { return Promise.resolve(result("single")); },
    maybeSingle() { return Promise.resolve(result("maybeSingle")); },
    then(ok, no) { return Promise.resolve(result("list")).then(ok, no); }
  };
  return q;
}

function fakeCreateClient(url, key, options = {}) {
  const authorization = options.global?.headers?.Authorization || null;
  return {
    auth: {
      async getUser(token) {
        if (token !== "token-a" && token !== "token-b" && token !== "token-a-rotated") {
          return { data: { user: null }, error: new Error("Invalid session") };
        }
        return {
          data: { user: { id: token === "token-b" ? "student-b" : "student-a", email: "student@example.com", user_metadata: {} } },
          error: null
        };
      },
      async signInWithPassword() {
        return { data: { user: { id: "student-a", email: "student@example.com", user_metadata: {} }, session: { access_token: "token-a", refresh_token: "refresh-a" } }, error: null };
      },
      async signUp() {
        return { data: { user: { id: "student-a" }, session: { access_token: "token-a", refresh_token: "refresh-a" } }, error: null };
      },
      async refreshSession({ refresh_token }) {
        if (refresh_token !== "refresh-a") {
          return { data: { session: null }, error: new Error("Invalid refresh token") };
        }
        return { data: { session: { access_token: "token-a-rotated", refresh_token: "refresh-rotated" } }, error: null };
      }
    },
    from(table) { return makeQuery(table, authorization); }
  };
}

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@supabase/supabase-js") return { createClient: fakeCreateClient };
  return originalLoad.call(this, request, parent, isMain);
};
let app;
try {
  app = require("../server");
} finally {
  Module._load = originalLoad;
}

test("authenticated student queries carry the correct Supabase bearer token", async () => {
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const root = "http://127.0.0.1:" + server.address().port;
    const headersA = { Authorization: "Bearer token-a" };
    const headersB = { Authorization: "Bearer token-b" };
    let r = await fetch(root + "/api/me", { headers: headersA });
    assert.equal(r.status, 200);
    let data = await r.json();
    assert.equal(data.stats.total, 5);
    assert.deepEqual(data.bookmarks, []);
    let callsA = databaseCalls.splice(0);
    assert.ok(callsA.length >= 3);
    assert.ok(callsA.every(c => c.authorization === "Bearer token-a"));
    assert.ok(callsA.every(c => c.filters.user_id !== "student-b"));

    r = await fetch(root + "/api/me", { headers: headersB });
    assert.equal(r.status, 200);
    const callsB = databaseCalls.splice(0);
    assert.ok(callsB.length >= 3);
    assert.ok(callsB.every(c => c.authorization === "Bearer token-b"));

    r = await fetch(root + "/api/me", { headers: { Authorization: "Bearer expired" } });
    assert.equal(r.status, 401);
    assert.equal(databaseCalls.length, 0);

    r = await fetch(root + "/api/history", { headers: headersA });
    assert.equal(r.status, 200);
    assert.ok(databaseCalls.splice(0).every(c => c.authorization === "Bearer token-a"));

    r = await fetch(root + "/api/bookmarks/toggle", {
      method: "POST", headers: { ...headersA, "Content-Type": "application/json" },
      body: JSON.stringify({ mcqId: "invalid" })
    });
    assert.equal(r.status, 400);
    assert.equal(databaseCalls.length, 0);

    failBookmarkInsert = true;
    r = await fetch(root + "/api/bookmarks/toggle", {
      method: "POST", headers: { ...headersA, "Content-Type": "application/json" },
      body: JSON.stringify({ mcqId: 74 })
    });
    assert.equal(r.status, 409, "A failed database insert must not be reported as a successful mark");
    assert.equal((await r.json()).error.includes("published to the database"), true);
    assert.ok(databaseCalls.splice(0).every(c => c.authorization === "Bearer token-a"));
    failBookmarkInsert = false;

    r = await fetch(root + "/api/bookmarks/toggle", {
      method: "POST", headers: { ...headersA, "Content-Type": "application/json" },
      body: JSON.stringify({ mcqId: 74 })
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).bookmarked, true);
    assert.ok(databaseCalls.splice(0).every(c => c.authorization === "Bearer token-a"));
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("login profile queries use the freshly signed-in student's token", async () => {
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const r = await fetch("http://127.0.0.1:" + server.address().port + "/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@example.com", password: "password123" })
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).token, "token-a");
    assert.ok(databaseCalls.splice(0).every(c => c.authorization === "Bearer token-a"));
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});


test("login sets an HttpOnly refresh cookie and never exposes the refresh token in JSON", async () => {
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const root = "http://127.0.0.1:" + server.address().port;
    let r = await fetch(root + "/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@example.com", password: "password123" })
    });
    assert.equal(r.status, 200);
    const sessionBody = await r.json();
    assert.equal(sessionBody.token, "token-a");
    assert.equal(Object.hasOwn(sessionBody, "refresh_token"), false);
    const cookie = r.headers.get("set-cookie");
    assert.ok(cookie.startsWith("sjn_refresh="));
    assert.match(cookie, /httponly/i);
    assert.match(cookie, /samesite=lax/i);
    assert.match(cookie, /path=\/api\/auth/i);

    r = await fetch(root + "/api/auth/refresh", { method: "POST" });
    assert.equal(r.status, 401, "No cookie cannot renew a session");

    r = await fetch(root + "/api/auth/refresh", {
      method: "POST", headers: { Cookie: "sjn_refresh=refresh-a" }
    });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { token: "token-a-rotated" });
    assert.match(r.headers.get("set-cookie"), /sjn_refresh=refresh-rotated/);
    assert.match(r.headers.get("cache-control"), /no-store/);

    r = await fetch(root + "/api/me", {
      headers: { Authorization: "Bearer token-a-rotated" }
    });
    assert.equal(r.status, 200);
    assert.ok(databaseCalls.splice(0).filter(x => x.table === "attempts").every(x =>
      x.authorization === "Bearer token-a-rotated"));

    r = await fetch(root + "/api/auth/refresh", {
      method: "POST", headers: { Cookie: "sjn_refresh=bad-token" }
    });
    assert.equal(r.status, 401);
    assert.match(r.headers.get("set-cookie"), /expires=Thu, 01 Jan 1970 00:00:00 GMT|Max-Age=0/i);

    r = await fetch(root + "/api/auth/logout", {
      method: "POST", headers: { Cookie: "sjn_refresh=refresh-rotated" }
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).ok, true);
    assert.match(r.headers.get("set-cookie"), /expires=Thu, 01 Jan 1970 00:00:00 GMT|Max-Age=0/i);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("dashboard and landing pages have explicit refresh-session integration", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const landing = fs.readFileSync(path.join(__dirname, "../public/landing.html"), "utf8");
  assert.match(dash, /function renewAccessToken\(\)/);
  assert.match(dash, /response\.status === 401/);
  assert.match(dash, /refreshPromise/);
  assert.match(landing, /auth\/refresh/);
  assert.doesNotMatch(landing, /localStorage\.setItem\(SJN_AUTH\.tokenKey,\s*data\.token/);
  assert.doesNotMatch(dash, /localStorage\.setItem\('sjn_auth_token'/);
});


test("landing page exclusively owns Login, Register, and Logout", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const landing = fs.readFileSync(path.join(__dirname, "../public/landing.html"), "utf8");
  assert.doesNotMatch(dash, /openAuthModal\(|logoutUser\(|id="auth-modal"|id="account-button"/);
  assert.doesNotMatch(dash, /onclick="[^"]*logout|onclick="[^"]*openAuthModal/);
  assert.match(dash, /href="\/landing\.html"/);
  assert.match(dash, /id="session-guard"/);
  assert.match(dash, /if \(!\(await loadAccount\(\)\)\) return/);
  assert.match(landing, /data-auth="signin">Login/);
  assert.match(landing, /data-auth="register"/);
  assert.match(landing, /data-session-only="signed"/);
  assert.match(landing, /data-logout/);
  assert.match(landing, /function renderLandingSession\(user\)/);
  assert.doesNotMatch(landing, /if \(response\.ok && \(await response\.json\(\)\)\.user\) \{\s*window\.location\.replace/);
  assert.match(landing, /window\.location\.replace\(SJN_AUTH\.dashboard\)/);
  assert.match(landing, /auth\/logout/);
});

test("dashboard and landing inline scripts remain syntactically valid", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  for (const name of ["index.html", "landing.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "../public", name), "utf8");
    let checked = 0;
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=/.test(match[1])) continue;
      assert.doesNotThrow(() => new Function(match[2]), name + " inline script syntax");
      checked++;
    }
    assert.ok(checked > 0);
  }
});
