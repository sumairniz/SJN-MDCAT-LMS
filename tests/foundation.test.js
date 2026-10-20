"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key";

const databaseCalls = [];
const practiceRpcCalls = [];
let practiceRpcError = null;
let failBookmarkInsert = false;

function makeQuery(table, authorization) {
  const filters = {};
  let action = "select";
  let selectedColumns = "";
  function result(kind) {
    databaseCalls.push({ table, authorization, filters: { ...filters }, action });
    if (table === "profiles") return { data: { name: "Student", role: "student" }, error: null };
    if (table === "attempts") {
      if (kind === "single") return { data: { id: 42 }, error: null };
      if (kind === "maybeSingle" && filters.id != null) {
        const owner = Number(filters.id) === 101 ? "student-a" :
          Number(filters.id) === 202 ? "student-b" : null;
        const current = authorization === "Bearer token-b" ? "student-b" : "student-a";
        if (!owner || owner !== current || filters.user_id !== current)
          return { data: null, error: null };
        return { data: { id: Number(filters.id), title: "Saved Biology", total: 1,
          correct: 1, accuracy: 100, mode: "tutor", subject: "Biology",
          selection_json: {}, created_at: "2026-10-19T17:00:00Z",
          details_version: 1, elapsed_seconds: 20 }, error: null };
      }
      if (selectedColumns.includes("selection_json")) {
        const isB = authorization === "Bearer token-b";
        const total = isB ? 20 : 15;
        return { data: [{ id: isB ? 202 : 101, title: "Biology practice", total,
          correct: isB ? 16 : 12, mode: "tutor", subject: "Biology",
          selection_json: {}, created_at: "2026-10-13T11:00:00Z" }], error: null };
      }
      return { data: [{ total: 5, correct: 3 }], error: null };
    }
    if (table === "attempt_items") {
      const owner = Number(filters.attempt_id) === 101 ? "student-a" :
        Number(filters.attempt_id) === 202 ? "student-b" : null;
      const current = authorization === "Bearer token-b" ? "student-b" : "student-a";
      return { data: owner && owner === current && filters.user_id === current ?
        [{ position: 1, mcq_id: 1, mcq_revision_id: 10,
           selected_index: 2, is_correct: true }] : [], error: null };
    }
    if (table === "mcq_revisions") return { data: [{
      id: 10, mcq_id: 1, bank: "Past Papers Question Bank", subject: "Biology",
      chapter: "Biomolecules", topic: "Proteins", source: "IBA",
      question: "Test question?", options_json: ["A","B","C","D"],
      correct_index: 2, explanation: "Source-explanation", mnemonic: ""
    }], error: null };
    if (table === "bookmarks") {
      if (action === "insert" && failBookmarkInsert) return { data: null, error: { code: "23503" } };
      return { data: kind === "maybeSingle" ? null : [], error: null };
    }
    return { data: [], error: null };
  }
  const q = {
    select(columns) { selectedColumns = columns || ""; return q; },
    eq(key, val) { filters[key] = val; return q; },
    in(key, vals) { filters[key] = vals; return q; },
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
        return { data: { user: { id: "student-a", email: "student@example.com", user_metadata: {} }, session: { access_token: "token-a-rotated", refresh_token: "refresh-rotated" } }, error: null };
      }
    },
    from(table) { return makeQuery(table, authorization); },
    async rpc(name, args) {
      practiceRpcCalls.push({ name, args, authorization });
      if (practiceRpcError) return { data: null, error: practiceRpcError };
      const total = args.p_items.length;
      const skipped = args.p_items.filter(x => x.selectedIndex === null).length;
      const correct = args.p_items.filter(x =>
        x.selectedIndex !== null && x.selectedIndex === (x.mcqId === 1 ? 2 : 0)
      ).length;
      return { data: [{
        attempt_id: 999, total_questions: total,
        correct_answers: correct, incorrect_answers: total - correct - skipped,
        skipped_answers: skipped, accuracy_percent: (100 * correct / total),
        already_saved: false
      }], error: null };
    }
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

test("bootstrap combines auth and RLS-scoped student data in one response",async()=>{
  const server=await new Promise(resolve=>{const s=app.listen(0,"127.0.0.1",()=>resolve(s));});
  try{
    const root="http://127.0.0.1:"+server.address().port;
    const login=await loginSession(root);
    databaseCalls.splice(0);
    const r=await fetch(root+"/api/auth/refresh?bootstrap=1",{method:"POST",headers:{Cookie:login.cookies}});
    assert.equal(r.status,200);
    const d=await r.json();
    assert.equal(d.user.id,"student-a");
    assert.equal(d.token,"token-a-rotated");
    assert.equal(d.expiresAt,login.body.expiresAt);
    assert.equal(d.stats.total,5);
    assert.deepEqual(d.bookmarks,[]);
    const calls=databaseCalls.splice(0);
    assert.equal(calls.length,3);
    assert.ok(calls.every(c=>c.authorization==="Bearer token-a-rotated"));
  }finally{
    await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  }
});

test("normal navigation shows privacy-safe restoring feedback while protecting dashboard", () => {
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
  assert.match(landing, /id="session-check-message">Restoring your session/);
  assert.match(landing, /#session-check-spinner/);
  assert.match(landing, /body\[data-session-state="checking"\] > :not\(#session-check\) \{ visibility: hidden; \}/);
  assert.match(landing, /sjn_recent_logout/);
  assert.match(dash, /sjn-load-shell/);
  assert.match(dash, /initialAccount \|\| await api/);
});

test("dashboard and landing pages have explicit refresh-session integration", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const landing = fs.readFileSync(path.join(__dirname, "../public/landing.html"), "utf8");
  assert.match(dash, /function renewAccessToken\(bootstrap = false\)/);
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
  assert.ok(dash.includes("window.location.replace(SJNPreviewAuthRoute.to('/landing.html'))"), 'All logout redirects must use allowlisted preview-preserving routing');
  assert.match(dash, /if \(!\(await loadAccount\(\)\)\) return/);
  assert.match(dash, /id="session-guard"/);
  assert.match(dash, /updateDashboardAccountUI\(currentUser\)/);
});

test("student history is scoped and tagged by authenticated student, never combined", async () => {
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const root = "http://127.0.0.1:" + server.address().port;
    const a = await loginSession(root);
    const b = await loginSession(root, "student-b@example.com");
    databaseCalls.splice(0);

    const responseA = await fetch(root + "/api/history", {
      headers: { Authorization: "Bearer token-a", Cookie: a.cookies }
    });
    assert.equal(responseA.status, 200);
    assert.match(responseA.headers.get("cache-control"), /no-store/);
    const historyA = await responseA.json();
    assert.equal(historyA.userId, "student-a");
    assert.deepEqual(historyA.attempts.map(x => x.total), [15]);
    const callsA = databaseCalls.splice(0);
    assert.ok(callsA.every(c => c.authorization === "Bearer token-a" &&
      c.filters.user_id === "student-a"));

    const responseB = await fetch(root + "/api/history", {
      headers: { Authorization: "Bearer token-b", Cookie: b.cookies }
    });
    assert.equal(responseB.status, 200);
    const historyB = await responseB.json();
    assert.equal(historyB.userId, "student-b");
    assert.deepEqual(historyB.attempts.map(x => x.total), [20]);
    const callsB = databaseCalls.splice(0);
    assert.ok(callsB.every(c => c.authorization === "Bearer token-b" &&
      c.filters.user_id === "student-b"));

    const mismatched = await fetch(root + "/api/history", {
      headers: { Authorization: "Bearer token-a", Cookie: b.cookies }
    });
    assert.equal(mismatched.status, 401);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("retired client-score submission is non-writing even with a valid session", async () => {
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const root = "http://127.0.0.1:" + server.address().port;
    const b = await loginSession(root, "student-b@example.com");
    databaseCalls.splice(0);
    const beforeRpc = practiceRpcCalls.length;
    const denied = await fetch(root + "/api/attempts", {
      method: "POST",
      headers: { Authorization: "Bearer token-b", Cookie: b.cookies,
        "Content-Type": "application/json", "X-SJN-Expected-Student": "student-b" },
      body: JSON.stringify({ total: 5, correct: 5, accuracy: 100 })
    });
    assert.equal(denied.status, 410);
    assert.match(denied.headers.get("cache-control"), /no-store/);
    assert.match((await denied.json()).error, /retired/i);
    assert.equal(databaseCalls.length, 0, "Retired submission must never write database rows");
    assert.equal(practiceRpcCalls.length, beforeRpc, "Retired route must not call grading RPC");
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("secure submission still blocks stale-account requests after legacy retirement", async () => {
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const root = "http://127.0.0.1:" + server.address().port;
    const b = await loginSession(root, "student-b@example.com");
    const startRpc = practiceRpcCalls.length;
    const response = await fetch(root + "/api/practice/submit", {
      method: "POST",
      headers: { Authorization: "Bearer token-b", Cookie: b.cookies,
        "Content-Type": "application/json", "X-SJN-Expected-Student": "student-a" },
      body: JSON.stringify({
        submissionKey: "422a58ec-97c1-4b4a-8000-264235641764",
        items: [{ mcqId: 1, revisionId: 1, selectedIndex: 0 }],
        title: "Practice", mode: "timed", subject: "Biology",
        selection: {}, elapsedSeconds: 5
      })
    });
    assert.equal(response.status, 409);
    assert.equal(practiceRpcCalls.length, startRpc, "No wrong-account score is saved");
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("dashboard never reads browser-wide personal history or restores stale statistics", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  assert.doesNotMatch(dash, /localStorage\.(?:getItem|setItem)\(['"]sjn_student_profile['"]/);
  assert.doesNotMatch(dash, /localStorage\.(?:getItem|setItem)\(['"]sjn_bookmarked_mcqs['"]/);
  assert.doesNotMatch(dash, /setTimeout\([^]*Object\.assign\(sjnProfile/);
  assert.match(dash, /api\('\/history'\)/);
  assert.match(dash, /payload\.userId !== expectedStudentId/);
  assert.match(dash, /const completedLogs = payload\.attempts\.map/);
  assert.match(dash, /const drafts=await api\('\/practice\/drafts'\)/);
  assert.match(dash, /drafts\.userId!==expectedStudentId/);
  assert.match(dash, /sjnProfile\.historyLogs=\[/);
  assert.match(dash, /X-SJN-Expected-Student/);
  assert.match(dash, /td\.textContent = String\(value \?\? ''\)/);
});


test("signed-cookie session status is read-only and preserves login deadline", async () => {
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const root = "http://127.0.0.1:" + server.address().port;
    const a = await loginSession(root);
    const missing = await fetch(root + "/api/auth/session");
    assert.equal(missing.status, 401);
    assert.match(missing.headers.get("cache-control"), /no-store/);
    const response = await fetch(root + "/api/auth/session", {
      headers: { Cookie: a.cookies }
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.deepEqual(await response.json(), {
      authenticated: true, userId: "student-a", expiresAt: a.body.expiresAt
    });
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("session notifications and cookie locks coordinate independent tabs", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");
  const js = fs.readFileSync(path.join(__dirname, "../public/session-coordination.js"), "utf8");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const landing = fs.readFileSync(path.join(__dirname, "../public/landing.html"), "utf8");
  const events = [], messages = [];
  let release;
  const firstWait = new Promise(done => { release = done; });
  let queue = Promise.resolve();
  const locks = { request(name, opts, cb) {
    assert.equal(name, "sjn_cookie_operations_v1");
    assert.equal(opts.mode, "exclusive");
    const task = queue.then(cb);
    queue = task.then(() => {}, () => {});
    return task;
  }};
  const window = {
    navigator: { locks },
    localStorage: { setItem(key, value) { messages.push({key, value}); } },
    addEventListener(name, cb) { if (name === "storage") events.push(cb); },
    fetch: async () => ({ status: 200 })
  };
  vm.runInNewContext(js, { window, Date, Math, JSON, Promise, console });
  let secondRan = false;
  const a = window.SJNSessionCoord.withCookieLock(() => firstWait);
  const b = window.SJNSessionCoord.withCookieLock(async () => { secondRan = true; });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(secondRan, false);
  release();
  await Promise.all([a, b]);
  assert.equal(secondRan, true);

  let received;
  window.SJNSessionCoord.subscribe(event => { received = event; });
  window.SJNSessionCoord.signal("login");
  events[0]({ key: messages[0].key, newValue: messages[0].value });
  assert.equal(received.type, "login");
  assert.doesNotMatch(messages[0].value, /refresh_token|access_token|password|email/);

  assert.match(landing, /SJNSessionCoord\.signal\('login'\)/);
  assert.match(dash, /SJNSessionCoord\.signal\('logout'\)/);
  assert.match(dash, /function verifyReturnedTab\(\)/);
  assert.match(dash, /active\.userId !== expectedUserId \|\| active\.expiresAt !== expectedExpiry/);
  assert.match(dash, /SJNSessionCoord\.withCookieLock/);
  assert.match(landing, /SJNSessionCoord\.withCookieLock/);
  assert.doesNotMatch(dash, /fetch\(API \+ '\/auth\/logout', \{[\s\S]*?\}\)\.catch\(\(\) => \{\}\)/);
});

test("ordinary tab switching preserves the visible MCQ and makes no session request", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const start = dash.indexOf("    window.addEventListener('focus', () => {");
  const stop = dash.indexOf("    let currentUser = null;", start);
  assert.ok(start > 0 && stop > start);
  const handlers = dash.slice(start, stop);
  assert.doesNotMatch(handlers, /coverWorkspaceOverlay\(\)|verifyReturnedTab\(\).*focus/);
  const actions = {};
  const documentActions = {};
  let isHidden = false;
  let expiryChecks = 0;
  let accountChecks = 0;
  let sessionRequests = 0;
  const fakeWindow = {
    addEventListener(name, fn) { actions[name] = fn; }
  };
  const fakeDocument = {
    addEventListener(name, fn) { documentActions[name] = fn; },
    get hidden() { return isHidden; }
  };
  vm.runInNewContext(handlers, {
    window: fakeWindow, document: fakeDocument,
    currentUser: { id: "student-a" },
    checkForAccountChange() { accountChecks++; return false; },
    expireSessionIfNeeded() { expiryChecks++; },
    verifyReturnedTab() { sessionRequests++; }
  });
  // Student is midway through Q4, visits Google, then returns to the same tab.
  isHidden = true;
  documentActions.visibilitychange();
  assert.equal(accountChecks, 0);
  assert.equal(expiryChecks, 0);
  isHidden = false;
  documentActions.visibilitychange();
  actions.focus();
  assert.equal(accountChecks, 2);
  assert.equal(expiryChecks, 2);
  assert.equal(sessionRequests, 0, "Returning to a normal tab must not reverify the session");
});

test("suspended tabs detect an actual account switch before exposing stale data", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const coord = fs.readFileSync(path.join(__dirname, "../public/session-coordination.js"), "utf8");
  const start = dash.indexOf("    let knownAuthSignal = SJNSessionCoord.latestSignal();");
  const stop = dash.indexOf("    window.handleDesktopClick", start);
  assert.ok(start > 0 && stop > start);
  const body = dash.slice(start, stop);
  let marker = JSON.stringify({ type: "login", nonce: "first" });
  let hidden = 0;
  const destinations = [];
  const scope = {
    SJNSessionCoord: {
      latestSignal() { return marker; },
      subscribe() {}
    },
    SJNPreviewAuthRoute: { to: path => path },
    coverPrivateWorkspace() { hidden++; },
    window: { location: { replace(p) { destinations.push(p); } } }
  };
  vm.runInNewContext(body + "\nthis.checkForAccountChange = checkForAccountChange;", scope);
  assert.equal(scope.checkForAccountChange(), false, "No account change is a no-op");
  assert.equal(hidden, 0);
  assert.deepEqual(destinations, []);
  marker = JSON.stringify({ type: "login", nonce: "second" });
  assert.equal(scope.checkForAccountChange(), true);
  assert.equal(hidden, 1);
  assert.deepEqual(destinations, ["/index.html"]);
  marker = JSON.stringify({ type: "logout", nonce: "third" });
  scope.checkForAccountChange();
  assert.equal(hidden, 1, "An already navigating tab must not reveal its workspace");
  assert.deepEqual(destinations, ["/index.html"]);

  // The current marker is readable without making a network request.
  const storage = { getItem() { return marker; }, setItem() {} };
  const win = { navigator: {}, localStorage: storage, addEventListener() {},
    fetch() { throw new Error("Tab return must not contact the server"); } };
  vm.runInNewContext(coord, { window: win, console, Promise, Date, Math, JSON });
  assert.equal(win.SJNSessionCoord.latestSignal(), marker);
});


test("authenticated background LMS tab opens without a stuck loading guard", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const start = dash.indexOf("    async function loadAccount() {");
  const end = dash.indexOf("    async function loadContent() {", start);
  assert.ok(start >= 0 && end > start, "Extract the actual dashboard loadAccount implementation");
  const actualLoadAccount = dash.slice(start, end) + "\nthis.loadAccount = loadAccount;";
  for (const background of [false, true]) {
    const revealed = [];
    const redirects = [];
    const guard = { classList: { add(name) { revealed.push(name); } } };
    const context = {
      performance: { now: () => 100 },
      console: { info() {}, warn() {} },
      document: { hidden: background, getElementById(name) {
        assert.equal(name, "session-guard");
        return guard;
      } },
      authToken: "mock-access-token",
      initialAccount: { user: { id: "student-a" },
        stats: { total: 15, correct: 12 }, bookmarks: [74] },
      currentUser: null,
      accountChangePending: false,
      checkForAccountChange: () => false,
      emptyStudentProfile: () => ({ historyLogs: [], mcqsAttempted: 0 }),
      sjnProfile: null, historyLoadStatus: "loading", bookmarkedMcqs: [],
      updateDashboardAccountUI() {},
      applyAuthenticatedStats() {},
      window: { location: { replace(url) { redirects.push(url); } } }
    };
    vm.runInNewContext(actualLoadAccount, context);
    assert.equal(await context.loadAccount(), true);
    assert.equal(context.currentUser.id, "student-a");
    assert.deepEqual(revealed, ["hidden"],
      "A verified student must see the dashboard even when its tab loaded in the background");
    assert.deepEqual(redirects, []);
  }
});

test("in-flight bootstrap never uncovers an account after another tab changes login", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");
  const dash = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  const start = dash.indexOf("    async function loadAccount() {");
  const end = dash.indexOf("    async function loadContent() {", start);
  assert.ok(start >= 0 && end > start);
  const script = dash.slice(start, end) + "\nthis.loadAccount = loadAccount;";
  const visible = [];
  const redirects = [];
  const context = {
    performance: { now: () => 200 }, console: { info() {}, warn() {} },
    document: { hidden: true, getElementById() {
      return { classList: { add(name) { visible.push(name); } } };
    } },
    authToken: "old-token",
    initialAccount: { user: { id: "student-a" }, stats: { total: 15 }, bookmarks: [] },
    currentUser: null,
    accountChangePending: true,
    checkForAccountChange() { throw Error("Should not recheck an already pending change"); },
    updateDashboardAccountUI() { throw Error("Old student should not be rendered"); },
    window: { location: { replace(path) { redirects.push(path); } } }
  };
  vm.runInNewContext(script, context);
  assert.equal(await context.loadAccount(), false);
  assert.deepEqual(visible, [], "Old student dashboard must remain covered");
  assert.equal(context.currentUser, null);
  assert.deepEqual(redirects, [], "Navigation is already being handled by the change event");
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

test("canonical staging alias loads Phase 4 after login even when the URL opt-in was lost", async () => {
  const http = require("node:http");
  const old = process.env.VERCEL_ENV;
  const alias = "sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app";
  const server = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const request = (host, path) => new Promise((resolve, reject) => {
    const req = http.get({
      hostname: "127.0.0.1",
      port: server.address().port,
      path,
      headers: { Host: host }
    }, response => {
      response.resume();
      response.on("end", () => resolve({
        status: response.statusCode,
        location: response.headers.location,
        cache: response.headers["cache-control"]
      }));
    });
    req.on("error", reject);
  });
  try {
    process.env.VERCEL_ENV = "preview";
    const redirect = await request(alias, "/index.html");
    assert.equal(redirect.status, 302);
    assert.equal(redirect.location, "/index.html?sjnPhase4Preview=1");
    assert.match(redirect.cache, /no-store/);
    const flagged = await request(alias, "/index.html?sjnPhase4Preview=1");
    assert.equal(flagged.status, 200, "Already-normalized preview must not loop");
    const tracking = await request(alias, "/index.html?utm_source=chatgpt.com&next=https://evil.invalid");
    assert.equal(tracking.status, 302);
    assert.equal(tracking.location, "/index.html?sjnPhase4Preview=1");
    const otherHost = await request("different-preview.vercel.app", "/index.html");
    assert.equal(otherHost.status, 200, "Other preview hosts must not change");
    process.env.VERCEL_ENV = "production";
    const production = await request(alias, "/index.html");
    assert.equal(production.status, 200, "Production cannot be redirected by this staging fix");
  } finally {
    if (old === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = old;
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("Stage 3B-2 saves database-graded ordered answers, not browser scores", async () => {
  const s = await new Promise(resolve => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
  try {
    const root = "http://127.0.0.1:" + s.address().port;
    const a = await loginSession(root);
    const key = "fa151abc-2fe0-4c18-970e-10f1d1d2f999";
    const submission = {
      submissionKey: key,
      title: "Past Papers Question Bank", subject: "Biology", mode: "tutor",
      selection: { chapters: ["Biological Molecules"] }, elapsedSeconds: 67,
      items: [{ mcqId: 1, revisionId: 1, selectedIndex: 2 },
              { mcqId: 2, revisionId: 2, selectedIndex: null }]
    };
    const before = practiceRpcCalls.length;
    const response = await fetch(root + "/api/practice/submit", {
      method: "POST", headers: {
        Authorization: "Bearer token-a", Cookie: a.cookies,
        "X-SJN-Expected-Student": "student-a",
        "Content-Type": "application/json"
      }, body: JSON.stringify(submission)
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.saved, true);
    assert.equal(body.id, 999);
    assert.equal(body.correct, 1);
    assert.equal(body.skipped, 1);
    assert.equal(body.incorrect, 0);
    assert.equal(body.total, 2);
    assert.equal(body.accuracy, 50);
    assert.equal(practiceRpcCalls.length, before + 1);
    assert.equal(practiceRpcCalls.at(-1).name, "sjn_submit_practice_attempt");
    assert.equal(practiceRpcCalls.at(-1).authorization, "Bearer token-a");
    assert.deepEqual(practiceRpcCalls.at(-1).args.p_items, submission.items);
    assert.equal(Object.hasOwn(practiceRpcCalls.at(-1).args, "p_correct"), false);
  } finally {
    await new Promise((resolve, reject) => s.close(e => e ? reject(e) : resolve()));
  }
});

test("Stage 3B-2 never submits on identity mismatch or malformed answer input", async () => {
  const s = await new Promise(resolve => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
  try {
    const root = "http://127.0.0.1:" + s.address().port;
    const a = await loginSession(root);
    const valid = {
      submissionKey: "fa151abc-2fe0-4c18-970e-10f1d1d2f999",
      title: "Practice", subject: "Biology", mode: "tutor", selection: {},
      elapsedSeconds: 60, items: [{ mcqId: 1, revisionId: 1, selectedIndex: 0 }]
    };
    const headers = {
      Authorization: "Bearer token-a", Cookie: a.cookies,
      "Content-Type": "application/json", "X-SJN-Expected-Student": "student-b"
    };
    const before = practiceRpcCalls.length;
    let r = await fetch(root + "/api/practice/submit", {
      method: "POST", headers, body: JSON.stringify(valid)
    });
    assert.equal(r.status, 409);
    assert.equal(practiceRpcCalls.length, before);
    headers["X-SJN-Expected-Student"] = "student-a";
    for (const override of [
      { correct: 100 }, // browser score is untrusted and never accepted
      { items: [valid.items[0], valid.items[0]] },
      { items: [{ mcqId: 1, revisionId: 1, selectedIndex: 9 }] },
      { submissionKey: "not-a-uuid" }
    ]) {
      r = await fetch(root + "/api/practice/submit", {
        method: "POST", headers, body: JSON.stringify({ ...valid, ...override })
      });
      assert.equal(r.status, 400);
    }
    assert.equal(practiceRpcCalls.length, before);
    practiceRpcError = { code: "23505", message: "conflicting retry" };
    r = await fetch(root + "/api/practice/submit", {
      method: "POST", headers, body: JSON.stringify(valid)
    });
    assert.equal(r.status, 409);
    practiceRpcError = null;
  } finally {
    practiceRpcError = null;
    await new Promise((resolve, reject) => s.close(e => e ? reject(e) : resolve()));
  }
});


test("historical detail route reads its own completed snapshot and rejects a foreign student", async () => {
  const s = await new Promise(resolve => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
  try {
    const root = "http://127.0.0.1:" + s.address().port;
    const accountA = await loginSession(root);
    const accountB = await loginSession(root, "student-b@example.com");
    const headersA = { Authorization: "Bearer token-a", Cookie: accountA.cookies };
    const headersB = { Authorization: "Bearer token-b", Cookie: accountB.cookies };
    let r = await fetch(root + "/api/history/101", { headers: headersA });
    assert.equal(r.status, 200);
    assert.match(r.headers.get("cache-control"), /no-store/);
    const saved = await r.json();
    assert.equal(saved.userId, "student-a");
    assert.equal(saved.attempt.id, 101);
    assert.equal(saved.reviewAvailable, true);
    assert.equal(saved.retakeAvailable, true);
    assert.equal(saved.items.length, 1);
    assert.equal(saved.items[0].selectedIndex, 2);
    assert.equal(saved.items[0].revisionId, 10);
    assert.equal(saved.items[0].question, "Test question?");
    r = await fetch(root + "/api/history/101", { headers: headersB });
    assert.equal(r.status, 404, "Another student cannot open a saved answer set");
    r = await fetch(root + "/api/history/202", { headers: headersA });
    assert.equal(r.status, 404);
    r = await fetch(root + "/api/history/202", { headers: headersB });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).userId, "student-b");
    r = await fetch(root + "/api/history/101");
    assert.equal(r.status, 401);
    r = await fetch(root + "/api/history/abc", { headers: headersA });
    assert.equal(r.status, 400);
  } finally {
    await new Promise((resolve, reject) => s.close(err => err ? reject(err) : resolve()));
  }
});
