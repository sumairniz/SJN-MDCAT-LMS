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
      async signInWithPassword({ email }) {
        const isB = email === "student-b@example.com";
        return { data: { user: { id: isB ? "student-b" : "student-a", email, user_metadata: {} }, session: { access_token: isB ? "token-b" : "token-a", refresh_token: isB ? "refresh-b" : "refresh-a" } }, error: null };
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

function sessionCookies(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  return ["sjn_refresh_v2", "sjn_session_v2"].map(name => {
    const found = setCookie.match(new RegExp("(?:^|,\\s*)" + name + "=([^;]+)"));
    assert.ok(found, "Expected signed session cookie " + name);
    return name + "=" + found[1];
  }).join("; ");
}
async function loginSession(root, email = "student@example.com") {
  const response = await fetch(root + "/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123" })
  });
  assert.equal(response.status, 200);
  return { body: await response.json(), cookies: sessionCookies(response), response };
}

test("authenticated student queries carry the correct Supabase bearer token", async () => {
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const root = "http://127.0.0.1:" + server.address().port;
    const a = await loginSession(root);
    const b = await loginSession(root, "student-b@example.com");
    const headersA = { Authorization: "Bearer token-a", Cookie: a.cookies };
    const headersB = { Authorization: "Bearer token-b", Cookie: b.cookies };
    databaseCalls.splice(0); // Ignore profile lookups performed during the two login calls.
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


test("login sets signed HttpOnly cookies and token refresh keeps original 24-hour deadline", async () => {
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const realNow = Date.now;
  const start = realNow();
  try {
    Date.now = () => start;
    const root = "http://127.0.0.1:" + server.address().port;
    const login = await loginSession(root);
    assert.equal(login.body.token, "token-a");
    assert.equal(login.body.expiresAt, start + 24 * 60 * 60 * 1000);
    assert.equal(Object.hasOwn(login.body, "refresh_token"), false);
    const cookieHeader = login.response.headers.get("set-cookie");
    assert.match(cookieHeader, /httponly/i);
    assert.match(cookieHeader, /samesite=lax/i);
    assert.match(cookieHeader, /path=\/api/i);
    assert.doesNotMatch(cookieHeader, /sjn_refresh=refresh-a(;|,)/);

    let r = await fetch(root + "/api/auth/refresh", { method: "POST" });
    assert.equal(r.status, 401, "No cookie cannot renew a session");

    Date.now = () => start + 23 * 60 * 60 * 1000;
    r = await fetch(root + "/api/auth/refresh", {
      method: "POST", headers: { Cookie: login.cookies }
    });
    assert.equal(r.status, 200);
    const renewed = await r.json();
    assert.equal(renewed.token, "token-a-rotated");
    assert.equal(renewed.expiresAt, login.body.expiresAt,
      "Refresh must never extend the login's original deadline");
    assert.match(r.headers.get("set-cookie"), /sjn_refresh_v2=refresh-rotated/);
    assert.match(r.headers.get("cache-control"), /no-store/);
    const rotatedCookies = sessionCookies(r);

    r = await fetch(root + "/api/me", {
      headers: { Authorization: "Bearer token-a-rotated", Cookie: rotatedCookies }
    });
    assert.equal(r.status, 200);
    assert.ok(databaseCalls.splice(0).filter(x => x.table === "attempts").every(x =>
      x.authorization === "Bearer token-a-rotated"));

    r = await fetch(root + "/api/me", {
      headers: { Authorization: "Bearer token-b", Cookie: rotatedCookies }
    });
    assert.equal(r.status, 401, "Session cookie must belong to the same student as bearer token");

    r = await fetch(root + "/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: rotatedCookies.replace("sjn_refresh_v2=refresh-rotated", "sjn_refresh_v2=forged") }
    });
    assert.equal(r.status, 401, "Forging refresh cookie cannot extend or reuse timebox");

    Date.now = () => start + 24 * 60 * 60 * 1000;
    r = await fetch(root + "/api/me", {
      headers: { Authorization: "Bearer token-a-rotated", Cookie: rotatedCookies }
    });
    assert.equal(r.status, 401, "Bearer token must stop at exactly 24 hours");
    r = await fetch(root + "/api/auth/refresh", {
      method: "POST", headers: { Cookie: rotatedCookies }
    });
    assert.equal(r.status, 401, "Refresh must be denied at the original deadline");

    r = await fetch(root + "/api/auth/logout", {
      method: "POST", headers: { Cookie: rotatedCookies }
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).ok, true);
    assert.match(r.headers.get("set-cookie"), /expires=Thu, 01 Jan 1970 00:00:00 GMT|Max-Age=0/i);
  } finally {
    Date.now = realNow;
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("normal navigation keeps verification splash hidden while protecting dashboard", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const landing = fs.readFileSync(path.join(__dirname, "../public/landing.html"), "utf8");
  assert.doesNotMatch(dash, /Verifying your student session/);
  assert.doesNotMatch(landing, /Verifying your student session/);
  assert.match(dash, /window\.addEventListener\('DOMContentLoaded', async/);
  assert.match(dash, /function scheduleSessionExpiry\(value\)/);
  assert.match(dash, /function expireSessionIfNeeded\(\)/);
  assert.match(dash, /session-guard/);
  assert.match(landing, /#session-check-message \{ display: none; \}/);
  assert.match(landing, /sjn_recent_logout/);
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


test("confirmed flow: Login/Register only on landing; Sign Out only in dashboard", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const landing = fs.readFileSync(path.join(__dirname, "../public/landing.html"), "utf8");
  assert.match(landing, /data-auth="signin">Login/);
  assert.match(landing, /data-auth="register"/);
  assert.doesNotMatch(landing, /data-logout|data-session-only="signed"/);
  assert.match(landing, /function checkSavedSession\(\)/);
  assert.match(landing, /window\.location\.replace\(SJN_AUTH\.dashboard\)/);
  assert.match(landing, /body\[data-session-state="checking"\] > :not\(#session-check\)/);
  assert.match(landing, /showGuestLanding\(\)/);
  assert.doesNotMatch(dash, /openAuthModal\(|window\.submitAuth\s*=|id="auth-modal"/);
  assert.doesNotMatch(dash, /Academy Home|href="\/landing\.html"/);
  assert.match(dash, /id="account-button"/);
  assert.match(dash, /id="desktop-dropdown"/);
  assert.match(dash, /id="mobile-user-name"/);
  assert.match(dash, /onclick="logoutUser\(\)"/);
  assert.match(dash, /window\.logoutUser = async function\(\)/);
  assert.match(dash, /fetch\(API \+ '\/auth\/logout'/);
  assert.match(dash, /window\.location\.replace\('\/landing\.html'\)/);
  assert.match(dash, /if \(!\(await loadAccount\(\)\)\) return/);
  assert.match(dash, /id="session-guard"/);
  assert.match(dash, /updateDashboardAccountUI\(currentUser\)/);
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
