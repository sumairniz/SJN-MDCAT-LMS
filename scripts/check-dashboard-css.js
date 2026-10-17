"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
const file = path.join(__dirname, "../public/dashboard.css");
assert.match(html, /<link rel="stylesheet" href="\/dashboard\.css">/);
assert.doesNotMatch(html, /cdn\.tailwindcss\.com|tailwind\.config\s*=/);
assert.ok(fs.existsSync(file), "Compiled CSS missing: run npm run build:css");
const css = fs.readFileSync(file, "utf8");
assert.ok(css.length > 15000, "Compiled dashboard stylesheet unexpectedly short");
const classes = [
  ".bg-sjn-black", ".bg-sjn-card", ".border-sjn-border", ".text-white",
  ".hidden", ".flex", ".grid", ".fixed", ".translate-x-full",
  ".md\\:hidden", ".sm\\:p-6", ".lg\\:p-8", ".bg-red-600",
  ".bg-zinc-900", ".rounded-xl", ".hover\\:border-red-500",
  ".selection\\:bg-red-600"
];
for (const className of classes) {
  assert.ok(css.includes(className), "Compiled CSS is missing " + className);
}
console.info("Verified " + classes.length + " critical CSS selectors (" + css.length + " bytes).");
