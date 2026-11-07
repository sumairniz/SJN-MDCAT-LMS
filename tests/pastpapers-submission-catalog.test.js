'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root=path.join(__dirname,'..');
const sql=fs.readFileSync(path.join(root,'database/migrations/20261029_past_paper_submission_catalog_validation.sql'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const manifest=require('../content/imports/siba-mdcat-2025-vb-180.staging.json');

test('Published Past Paper graders use catalog membership, not yearly bank name whitelists',()=>{
 assert.match(sql,/FROM public\.past_papers AS pp/);
 assert.match(sql,/pp\.mcq_ids_json @> pg_catalog\.jsonb_build_array\(m\.id\)/);
 assert.match(sql,/m\.bank IN \('Past Papers Question Bank','SJN Question Bank'\)/);
 assert.doesNotMatch(sql,/m\.bank IN \([^\n]*SIBA MDCAT Past Papers/);
 assert.match(sql,/m\.current_revision_id = v_revision_id/);
 assert.match(sql,/r\.bank = m\.bank/);
 assert.match(sql,/r\.id = m\.current_revision_id AND r\.mcq_id = m\.id/);
 assert.match(sql,/SECURITY DEFINER/);
 assert.match(sql,/REVOKE ALL ON FUNCTION/);
 assert.match(sql,/TO authenticated/);
 assert.doesNotMatch(sql,/TRUNCATE|DROP TABLE|DELETE FROM public\.attempts/i);
});
test('Curated SIBA paper has 180 ordered questions, preserves key and provisional tags',()=>{
 const items=manifest.questions;
 assert.equal(items.length,180);
 assert.ok(items.every((q,i)=>q.originalNumber===i+1 && q.options.length===4 && q.correctIndex>=0 && q.correctIndex<=3));
 assert.equal(items[81].correctIndex,0);
 assert.equal(items[69].topic,'Nucleic Acid');
 assert.match(html,/new Set\(ids\)\.size !== ids\.length/);
 assert.match(html,/mcqCount:questions\.length/);
 assert.match(html,/launchGeneratedQuiz\(questions\)/);
 assert.doesNotMatch(html,/paper\.mcqIds\.length !== 180/);
});
