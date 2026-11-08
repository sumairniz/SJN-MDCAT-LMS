"use strict";

/*
 * SJN permanent release-hygiene guard.
 * This checks tracked source in CI on staging pushes and pull requests to main.
 * It cannot decide whether every change is production-ready; a human diff review
 * and the owner's separate authorization remain mandatory.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const RESERVED_MARKERS = [
  "SJN_TEMP_DIAGNOSTIC",
  "SJN_DEBUG_ONLY",
  "SJN_STAGING_ONLY_INSTRUMENTATION"
];

function isRuntimeSource(file) {
  return file === "server.js" ||
    file === "vercel.json" ||
    /^(?:public|api|src)\//.test(file) ||
    (/^scripts\//.test(file) && file !== "scripts/check-release-safety.js");
}

function isForbiddenPath(file) {
  const segments = file.split("/");
  if (segments.some(segment =>
    /^(?:diagnostics?|experiments?|scratch|tmp|temporary)$/i.test(segment))) return true;
  const name = segments[segments.length - 1];
  if (/^\.env(?:\.|$)/.test(name) && name !== ".env.example") return true;
  if (isRuntimeSource(file) && /^(?:debug|temp|diagnostic)[-_]/i.test(name)) return true;
  return false;
}

function checkFiles(files, readFile) {
  const issues = [];
  for (const file of files) {
    const normalized = String(file).replaceAll("\\", "/");
    if (isForbiddenPath(normalized)) {
      issues.push(normalized + ": temporary or private file path is not release-safe");
      continue;
    }
    if (!isRuntimeSource(normalized)) continue;
    let content;
    try { content = readFile(normalized); }
    catch (error) {
      issues.push(normalized + ": cannot inspect source: " + error.message);
      continue;
    }
    for (const marker of RESERVED_MARKERS) {
      if (content.includes(marker)) {
        issues.push(normalized + ": contains diagnostic marker " + marker);
      }
    }
  }
  return issues;
}

function trackedFiles() {
  const raw = execFileSync("git", ["ls-files", "-z"], {
    cwd: ROOT, encoding: "utf8"
  });
  return raw.split("\0").filter(Boolean);
}

function main() {
  const issues = checkFiles(trackedFiles(), file =>
    fs.readFileSync(path.join(ROOT, file), "utf8"));
  if (issues.length) {
    console.error("Release-hygiene check FAILED:");
    for (const issue of issues) console.error(" - " + issue);
    console.error("Keep temporary instrumentation on a non-merged diagnostic branch.");
    process.exitCode = 1;
    return;
  }
  console.info("Release-hygiene check passed (known diagnostic markers and paths).");
  console.info("Manual release review and owner approval are still required.");
}

if (require.main === module) main();
module.exports = { checkFiles, isRuntimeSource, isForbiddenPath, RESERVED_MARKERS };
