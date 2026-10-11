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
        if (token !== "token-a" && token !== "token-b") {
          return { data: { user: null }, error: new Error("Invalid session") };
        }
        return {
          data: { user: { id: token === "token-a" ? "student-a" : "student-b", email: "student@example.com", user_metadata: {} } },
          error: null
        };
      },
      async signInWithPassword() {
        return { data: { user: { id: "student-a", email: "student@example.com", user_metadata: {} }, session: { access_token: "token-a" } }, error: null };
      },
      async signUp() {
        return { data: { user: { id: "student-a" }, session: { access_token: "token-a" } }, error: null };
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
