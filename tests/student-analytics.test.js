'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'public/sjn-analytics.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public/sjn-analytics.css'),'utf8');
const api=fs.readFileSync(path.join(root,'server.js'),'utf8');
const sql=fs.readFileSync(path.join(root,'database/migrations/20261105_student_analytics_v1.sql'),'utf8');

test('Analytics frontend parses, loads on demand and preserves other SPA modules',()=>{
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'sjn-analytics.js'}));
 assert.match(html,/id="module-analytics"/);
 assert.match(html,/id="tab-analytics"/);
 assert.match(html,/window\.SJNAnalytics\?\.enter\(\)/);
 assert.match(html,/window\.SJNAnalyticsBridge/);
 assert.match(html,/sjn-analytics\.css/);
 assert.match(html,/sjn-analytics\.js/);
 assert.match(html,/window\.SJNAnalytics\?\.reset\(\)/);
 assert.match(html,/window\.SJNAnalytics\?\.invalidate\(\)/);
 assert.match(html,/id="module-history"/);
 assert.match(html,/id="module-wizard"/);
 assert.match(html,/id="module-resources"/);
});
test('Analytics scopes its data to logged-in student and does not cache across accounts',()=>{
 assert.match(js,/state\.owner!==uid/);
 assert.match(js,/uid!==user\(\)/);
 assert.match(js,/payload\?\.userId!==uid/);
 assert.match(js,/function reset\(\)/);
 assert.match(js,/state\.cache\.clear\(\)/);
 assert.match(js,/state\.generation\+\+/);
 assert.match(js,/window\.SJNAnalyticsBridge\.load/);
 assert.doesNotMatch(js,/localStorage|sessionStorage/);
});
test('Analytics uses the approved four sections, hierarchy, date periods and evidence threshold',()=>{
 for(const name of ['SJN Question Bank','Past Papers Question Bank','My Courses','Full-Length Past Papers'])
  assert.ok(js.includes(name),name);
 for(const name of ['Last 24 Hours','Last 7 Days','Last 15 Days','Last 30 Days','Last 90 Days','Previous Month','Custom Range','All Time'])
  assert.ok(js.includes(name),name);
 assert.match(js,/data-a-bank/);assert.match(js,/btn\.dataset\.aSubject/);
 assert.match(js,/btn\.dataset\.aChapter/);assert.match(js,/data-a-course/);assert.match(js,/data-a-paper/);
 assert.match(js,/answered\(r\)>=15/);
 assert.match(js,/More practice needed/);
 assert.match(js,/No answered questions in this period yet/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/prefers-reduced-motion/);
});
test('Analytics endpoint is read-only, authenticated, period validated and sends only aggregated results',()=>{
 assert.match(api,/app\.get\('\/api\/student-analytics', auth/);
 assert.match(api,/\.rpc\('sjn_student_analytics'/);
 assert.match(api,/res\.json\(\{userId:req\.user\.id,summary:data\}\)/);
 assert.match(sql,/SECURITY INVOKER/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/i\.user_id=v_uid/);
 assert.match(sql,/a\.user_id = v_uid/);
 assert.match(sql,/details_version = 1/);
 assert.match(sql,/FROM public\.attempt_items/);
 assert.match(sql,/FROM public\.mcqs/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.sjn_student_analytics/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.sjn_student_analytics[^\n]+TO authenticated/);
 assert.doesNotMatch(sql,/\b(UPDATE|DELETE|INSERT INTO) public\.(attempts|attempt_items|mcqs)/i);
 assert.doesNotMatch(api,/app\.post\('\/api\/student-analytics'/);
});
