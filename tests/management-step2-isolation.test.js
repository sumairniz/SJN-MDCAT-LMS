"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const management = path.join(root, "apps/management");
const read = name => fs.readFileSync(path.join(management, name), "utf8");
test("Management Step 2 has no student app file imports or active authentication", () => {
  const page = read("index.html");
  const client = read("app.js");
  const config = JSON.parse(read("vercel.json"));
  assert.match(page, /SJN Madnest/);
  assert.match(page, /Management Sign In/);
  assert.match(page, /id="email"[^>]*disabled/);
  assert.match(page, /id="password"[^>]*disabled/);
  assert.match(page, /Sign In <span[^>]*>→<\/span><\/button>/);
  assert.doesNotMatch(client, /\bfetch\s*\(|\bXMLHttpRequest\b|supabase|localStorage|sessionStorage/);
  assert.doesNotMatch(page, /<form\b/i);
  assert.ok(config.headers[0].headers.find(x => x.key === "Content-Security-Policy").value.includes("connect-src 'none'"));
  assert.ok(config.headers[0].headers.find(x => x.key === "Content-Security-Policy").value.includes("form-action 'none'"));
});
test("Management Step 2 shows no fabricated student statistics", () => {
  const page = read("index.html");
  assert.match(page, /Registered Students<\/span><strong>—<\/strong>/);
  assert.match(page, /Published MCQs<\/span><strong>—<\/strong>/);
  assert.match(page, /No student data, privileged APIs or live management functions/);
});
