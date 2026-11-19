'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');

test('Main LMS workspace remains the actual touch-scrolling container',()=>{
  assert.match(html,/<main id="sjn-workspace-main" class="[^"]*overflow-y-auto[^"]*">/);
  assert.match(html,/<body class="[^"]*h-screen flex overflow-hidden/);
});

test('Mobile-only 3px workspace scrollbar uses a transparent track and neutral thumb',()=>{
  assert.match(html,/@media\s*\(max-width:\s*767px\)\s*\{\s*#sjn-workspace-main::-webkit-scrollbar\s*\{\s*width:\s*3px;\s*height:\s*3px;/);
  assert.match(html,/#sjn-workspace-main::-webkit-scrollbar-track\s*\{\s*background:\s*transparent;/);
  assert.match(html,/#sjn-workspace-main::-webkit-scrollbar-thumb\s*\{\s*background:\s*#52525b;\s*border-radius:\s*4px;/);
  assert.match(html,/#sjn-workspace-main::-webkit-scrollbar-thumb:hover\s*\{\s*background:\s*#52525b;/);
});

test('Desktop/global scrollbar remains untouched, no scripted auto-hide or global overflow changes',()=>{
  assert.match(html,/::-webkit-scrollbar\s*\{\s*width:\s*6px;\s*height:\s*6px;/);
  assert.match(html,/::-webkit-scrollbar-track\s*\{\s*background:\s*#09090b;/);
  assert.match(html,/::-webkit-scrollbar-thumb\s*\{\s*background:\s*#3f3f46;\s*border-radius:\s*4px;/);
  assert.match(html,/::-webkit-scrollbar-thumb:hover\s*\{\s*background:\s*#dc2626;/);
  const body = html.slice(html.indexOf('/* Owner-approved 2026-10-28: Mobile MAIN WORKSPACE scrollbar only.'),html.indexOf('    .glow-red {'));
  assert.doesNotMatch(body,/addEventListener|setTimeout|setInterval|scrollbar-width:\s*none|display:\s*none|overflow:\s*hidden/);
  assert.doesNotMatch(body,/\.module-view|#sidebar-nav|#module-pastpapers/);
});
