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
 const nextSql=fs.readFileSync(path.join(root,'database/migrations/20261105_student_analytics_period_and_course_detail.sql'),'utf8');
 assert.match(nextSql,/period_coverage AS/);
 assert.match(nextSql,/COUNT\(DISTINCT i\.mcq_id\)/);
 assert.match(nextSql,/FROM chosen a/);
 assert.match(nextSql,/course_attempt_breakdown AS/);
 assert.match(nextSql,/GROUP BY attempt_id,group_key,subject,chapter/);
 assert.match(nextSql,/SECURITY INVOKER/);
 assert.match(nextSql,/periodCoverage/);
 assert.match(nextSql,/courseAttemptBreakdown/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.sjn_student_analytics[^\n]+TO authenticated/);
 assert.doesNotMatch(sql,/\b(UPDATE|DELETE|INSERT INTO) public\.(attempts|attempt_items|mcqs)/i);
 assert.doesNotMatch(api,/app\.post\('\/api\/student-analytics'/);
});

test('Date-filter API accepts genuine ISO timestamps but rejects malformed dates',()=>{
 const match=api.match(/!\/(\^.+?\$)\/\.test\(value\)/);
 assert.ok(match,'Missing strict ISO format guard');
 const valid=new RegExp(match[1]);
 assert.equal(valid.test('2026-11-05T03:15:00.000Z'),true);
 assert.equal(valid.test('2026-11-05'),false);
 assert.equal(valid.test('2026-11-05T03:15:00Z'),false);
 assert.equal(valid.test('2026-11-05T03:15:00.000Zextra'),false);
 assert.match(js,/period:'all'/,'All Time must be the default');
});
test('Refined Analytics has readable outcomes, identity colors and interactive graph tooltips',()=>{
 assert.match(js,/data-a-chart-point/);
 assert.match(js,/function pointTooltip/);
 assert.match(js,/pointermove/);
 assert.match(js,/pointerdown/);
 assert.match(js,/plotNearestPoint/);
 assert.match(js,/focusin/);
 assert.match(js,/Monthly/);
 assert.match(js,/Weekly/);
 assert.match(js,/Daily/);
 assert.match(js,/data-subject/);
 assert.match(js,/data-region/);
 assert.match(js,/function countPills/);
 assert.match(js,/correct.*incorrect.*skipped/);
 assert.match(css,/sjn-a-counts/);
 assert.match(css,/sjn-a-chart-tooltip/);
 for(const id of ['bio','chem','phys','eng','lr'])assert.ok(css.includes('data-subject="'+id+'"'));
 for(const id of ['sindh','punjab','kpk','balochistan','federal','nums'])assert.ok(css.includes('data-region="'+id+'"'));
 assert.doesNotMatch(js,/sjn-a-head-icon.*chart-line/);
});

test('Overview separately displays period-scoped total and unique answered with skips excluded',()=>{
 const revised=fs.readFileSync(path.join(root,
   'database/migrations/20261105_student_analytics_unique_answered.sql'),'utf8');
 assert.match(revised,/\bunique_answered\b/);
 assert.match(revised,/COUNT\(DISTINCT mcq_id\) FILTER \(WHERE selected_index IS NOT NULL\)/);
 assert.match(revised,/FROM facts/);
 assert.match(revised,/chosen AS MATERIALIZED/);
 assert.match(revised,/SECURITY INVOKER/);
 assert.match(revised,/auth\.uid\(\)/);
 assert.match(js,/metric\('Total Answered'/);
 assert.match(js,/metric\('Unique Answered'/);
 assert.match(js,/t\.unique_answered/);
 assert.match(js,/Distinct MCQs answered/);
 assert.match(js,/data\.totals\.unique_answered>number\(data\.totals\.answered\)/);
 assert.doesNotMatch(js,/Older score-only attempts are excluded/);
 assert.doesNotMatch(js,/<footer class="sjn-a-foot">/);
 assert.match(css,/sjn-a-metrics\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:600px\)/);
});

test('Final Analytics mobile layouts keep two inner metrics equal and promote Overview accuracy',()=>{
 const mobile=css.slice(css.lastIndexOf('/* Owner-approved final mobile arrangement'));
 assert.ok(mobile.length>100,'Expected narrow-screen layout override');
 assert.match(mobile,/@media\(max-width:600px\)/);
 assert.match(mobile,/\.sjn-a-metrics > \.sjn-a-metric:first-child\{grid-column:1\/-1\}/);
 assert.match(mobile,/\.sjn-a-metrics > \.sjn-a-metric:not\(:first-child\)\{grid-column:auto\}/);
 assert.match(mobile,/\.sjn-a-inline-stat\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
 assert.match(mobile,/\.sjn-a-inline-stat > \.sjn-a-metric\{grid-column:auto;min-width:0\}/);
 assert.doesNotMatch(css,/\.sjn-a-metric:last-child\{grid-column:1\/-1\}/);
 // Existing desktop design remains five metric cards per row.
 assert.match(css,/\.sjn-a-metrics\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)\}/);
 // The DOM's first Overview card must be Answer Accuracy, followed by four small cards.
 const overview=js.slice(js.indexOf('function overview('),js.indexOf('function breadcrumb('));
 const labels=['Answer Accuracy','Total Answered','Unique Answered','Tests Completed','Skipped Questions'];
 const positions=labels.map(label=>overview.indexOf("metric('"+label+"'"));
 assert.ok(positions.every(p=>p>=0),'All five cards should remain');
 assert.ok(positions.every((p,i)=>i===0||p>positions[i-1]),'The card order must remain accuracy, total, unique, tests, skipped');
});
