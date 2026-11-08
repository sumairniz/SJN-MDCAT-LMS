"use strict";
// Static safety checks for the proposed, UNAPPLIED Stage 3B migration.
// These checks do NOT prove PostgreSQL execution, RLS isolation or client behavior.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sql = fs.readFileSync(path.join(__dirname, "..", "database", "migrations",
  "20261018_stage3b_question_history_foundation.sql"), "utf8");

test("Stage 3B proposal is restricted to staging and preserves the 74 original MCQs", () => {
  assert.match(sql, /REVIEW ONLY/);
  assert.match(sql, /aozknkrwafowsrehdwlr/);
  assert.match(sql, /Never apply to production/);
  assert.match(sql, /n <> 74/);
  assert.match(sql, /r\.question IS DISTINCT FROM m\.question/);
  assert.match(sql, /r\.options_json IS DISTINCT FROM m\.options_json/);
  assert.match(sql, /r\.correct_index IS DISTINCT FROM m\.correct_index/);
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /COMMIT;/);
});

test("Stage 3B proposal uses versioned immutable questions and ordered per-student items", () => {
  assert.match(sql, /CREATE TABLE public\.mcq_revisions/);
  assert.match(sql, /CREATE TABLE public\.attempt_items/);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON public\.mcq_revisions/);
  assert.match(sql, /FOREIGN KEY \(attempt_id,user_id\)/);
  assert.match(sql, /FOREIGN KEY \(mcq_id,mcq_revision_id\)/);
  assert.match(sql, /PRIMARY KEY \(attempt_id,position\)/);
  assert.match(sql, /UNIQUE \(attempt_id,mcq_id\)/);
  assert.match(sql, /submission_key uuid/);
  assert.match(sql, /details_version smallint NOT NULL DEFAULT 0/);
});

test("Stage 3B proposal scopes student reads without breaking the current legacy attempt writer", () => {
  assert.match(sql, /ALTER TABLE public\.attempt_items ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /ALTER TABLE public\.mcq_revisions ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /user_id = \(SELECT auth\.uid\(\)\)/);
  assert.match(sql, /REVOKE ALL PRIVILEGES ON public\.attempt_items/);
  assert.match(sql, /REVOKE ALL PRIVILEGES ON public\.mcq_revisions/);
  assert.doesNotMatch(sql, /REVOKE\s+.*ON\s+public\.attempts/i);
  assert.doesNotMatch(sql, /DROP\s+(?:TABLE|SCHEMA)/i);
  assert.doesNotMatch(sql, /TRUNCATE\s+/i);
  assert.doesNotMatch(sql, /DELETE\s+FROM\s+public\.(?:attempts|mcqs|bookmarks)/i);
});

test("preflight remains correctly parenthesized after Stage 3B syntax fix", () => {
  assert.match(sql, /jsonb_array_length\(options_json\) <> 4 ELSE TRUE END\)/);
  assert.doesNotMatch(sql, /jsonb_array_length\(options_json\) <> 4 ELSE TRUE END\)\)/);
});
