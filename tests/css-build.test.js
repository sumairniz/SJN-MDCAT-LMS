"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("dashboard uses precompiled CSS, preserving its Tailwind v3 theme", () => {
  const root = path.resolve(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
  const config = require("../tailwind.config.cjs");
  const pkg = require("../package.json");
  assert.match(html, /<link rel="stylesheet" href="\/dashboard\.css">/);
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com|tailwind\.config\s*=/);
  assert.equal(pkg.dependencies.tailwindcss, "3.4.17");
  assert.match(pkg.scripts.postinstall, /build:css/);
  assert.match(pkg.scripts.postinstall, /check:css/);
  assert.equal(config.darkMode, "class");
  assert.equal(config.theme.extend.colors.sjn.black, "#09090B");
  assert.equal(config.theme.extend.colors.sjn.card, "#121215");
  assert.equal(config.theme.extend.colors.sjn.border, "#27272A");
  assert.deepEqual(config.theme.extend.fontFamily.sans, ["Inter", "sans-serif"]);
  assert.ok(config.content.includes("./public/index.html"));
});
