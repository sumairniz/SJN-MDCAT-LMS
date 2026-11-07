"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { checkFiles, isRuntimeSource, isForbiddenPath } =
  require("../scripts/check-release-safety.js");

test("release guard rejects known temporary instrumentation in application source", () => {
  const issues = checkFiles(["server.js", "public/index.html", "api/health.js"], file =>
    file === "server.js" ? "const code = 'SJN_TEMP_DIAGNOSTIC';" :
      file === "public/index.html" ? "<script>/* SJN_DEBUG_ONLY */</script>" :
        "/* SJN_STAGING_ONLY_INSTRUMENTATION */");
  assert.equal(issues.length, 3);
  assert.ok(issues.every(msg => msg.includes("diagnostic marker")));
});

test("release guard rejects temporary folders and private env files", () => {
  const paths = [
    "diagnostics/session-trace.js", "public/temp-server.js",
    ".env", "config/.env.production", "scripts/experiments/measure.js",
    ".github/diagnostic/pipeline.yml"
  ];
  assert.ok(paths.every(isForbiddenPath));
  const issues = checkFiles(paths, () => "safe");
  assert.equal(issues.length, paths.length);
  assert.equal(isForbiddenPath(".env.example"), false);
});

test("release guard accepts production source and does not scan test documentation text", () => {
  const files = ["server.js", "public/index.html", "scripts/sync-content.js",
    "tests/example.test.js", "docs/RELEASE-SAFETY-CHECKLIST.md", ".env.example"];
  const issues = checkFiles(files, file =>
    file.startsWith("tests/") || file.startsWith("docs/")
      ? "SJN_TEMP_DIAGNOSTIC used as a test example"
      : "production application source");
  assert.deepEqual(issues, []);
  assert.equal(isRuntimeSource("server.js"), true);
  assert.equal(isRuntimeSource("tests/foundation.test.js"), false);
  assert.equal(isRuntimeSource("scripts/check-release-safety.js"), false);
});

test("release guard scans actual application code without blocking the clean dev branch", () => {
  const root = path.resolve(__dirname, "..");
  const files = ["server.js", "vercel.json", "public/index.html",
    "public/landing.html", "public/session-coordination.js"];
  assert.deepEqual(checkFiles(files, file =>
    fs.readFileSync(path.join(root, file), "utf8")), []);
});
