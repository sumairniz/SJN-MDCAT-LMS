'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const ui=fs.readFileSync(path.join(root,'public/sjn-academy-resources.js'),'utf8');
const api=fs.readFileSync(path.join(root,'lib/academy-resources.js'),'utf8');
const sql=fs.readFileSync(path.join(root,'database/migrations/20261103_academy_resources_private_pdf_folders.sql'),'utf8');
test('Resource data no longer loads within critical MCQ content endpoint',()=>{
 const section=server.split("app.get('/api/content'")[1]?.split('// --- SUPABASE AUTHENTICATION ENDPOINTS ---')[0]||'';
 assert.doesNotMatch(section,/from\('resources'\)|academy_resource_files|academy_resource_folders/);
 assert.doesNotMatch(section,/resources:\s*resources/);
 assert.match(server,/registerAcademyResourceRoutes\(app, auth\)/);
 assert.match(html,/modName === 'resources'\) void window\.SJNResources\?\.enter\(\)/);
 assert.doesNotMatch(html,/window\.sjnResources\s*=/);
});
test('Private resources use authenticated, explicitly published records and expiring link',()=>{
 assert.match(api,/app\.get\('\/api\/academy-resources',auth/);
 assert.match(api,/app\.get\('\/api\/academy-resources\/:id\/open',auth/);
 assert.match(api,/\.eq\('is_published',true\)/);
 assert.match(api,/expiresInSeconds:180/);
 assert.match(api,/R2_BUCKET_NAME/);
 assert.match(api,/if\(!url\)return res\.status\(503\)/);
 assert.match(sql,/enable row level security/g);
 assert.match(sql,/to authenticated using \(is_published = true\)/);
 assert.match(sql,/grant select on public\.academy_resource_folders, public\.academy_resource_files to authenticated/);
 assert.doesNotMatch(sql,/grant (insert|update|delete|all) on public\.academy_resource_(files|folders) to authenticated/i);
});
test('Folder UI loads lazily with expanded desktop and mobile PDF reader',()=>{
 assert.doesNotThrow(()=>new vm.Script(ui));
 assert.match(ui,/\[data-r-folder\]/);
 assert.match(ui,/\[data-r-file\]/);
 assert.match(ui,/\[data-r-expand\]/);
 assert.match(ui,/sjn-r-expanded/);
 assert.match(ui,/owner!==uid/);
 assert.match(html,/window\.SJNResources\?\.reset\(\)/);
 const css=fs.readFileSync(path.join(root,'public/sjn-academy-resources.css'),'utf8');
 assert.match(css,/@media\(max-width:767px\)/);
 assert.match(css,/#module-resources\.sjn-r-expanded #resource-viewer/);
});

test('Responsive continuous PDF.js viewer stays private, paged and lazy',()=>{
 assert.match(ui,/import\(PDFJS_URL\)/);
 assert.match(ui,/pdf\.worker\.min\.mjs/);
 assert.match(ui,/fetch\(link\.url/);
 assert.match(ui,/page\.render\(\{canvasContext:ctx,viewport\}\)/);
 assert.match(ui,/sjn-r-page-slot/);
 assert.match(ui,/visibleIndices/);
 assert.match(ui,/pruneCanvas/);
 assert.match(ui,/data-r-page-input/);
 assert.match(ui,/data-r-zoom-input/);
 assert.match(ui,/touchmove/);
 assert.match(ui,/scrollTo/);
 assert.doesNotMatch(ui,/<button[^>]*download/i);
});
test('Continuous modal reader and mobile viewport isolation',()=>{
 const css=fs.readFileSync(path.join(root,'public/sjn-academy-resources.css'),'utf8');
 assert.match(css,/#module-resources\.sjn-r-reading #resource-viewer/);
 assert.match(ui,/data-r-close/);
 assert.match(ui,/stopReader\(\)/);
 assert.match(ui,/sjn-r-pages/);
 assert.match(css,/sjn-r-folder-icon/);
 assert.match(css,/sjn-r-scroll/);
});
test('Interactive resources use collection and document cards without modifying course or exam APIs',()=>{
 const css=fs.readFileSync(path.join(root,'public/sjn-academy-resources.css'),'utf8');
 assert.match(ui,/sjn-r-collection-grid/);
 assert.match(ui,/sjn-r-document-grid/);
 assert.match(ui,/sjn-r-resource-card/);
 assert.match(ui,/data-r-folder/);
 assert.match(ui,/data-r-file/);
 assert.match(ui,/data-r-card-type|sjn-r-card-type/);
 assert.match(css,/sjn-r-resource-card:hover/);
 assert.match(css,/sjn-r-resource-card:focus-visible/);
 assert.match(css,/#module-resources>div\.bg-sjn-card\{background:transparent/);
 assert.match(css,/#module-resources\.sjn-r-reading>div\.bg-sjn-card>div:first-child\{display:none\}/);
 assert.doesNotMatch(ui,/window\.location\s*=/);
});

test('Large PDFs stream once without duplicate range/full GET; small PDFs retain fast path',()=>{
 assert.match(ui,/Number\(file\.size_bytes\)>=1024\*1024/);
 assert.match(ui,/disableRange:true/);
 assert.match(ui,/disableStream:false/);
 assert.match(ui,/disableAutoFetch:false/);
 assert.doesNotMatch(ui,/rangeChunkSize:512\*1024/);
 assert.doesNotMatch(ui,/pdfTask\.onProgress/);
 assert.match(ui,/pdfTask=lib\.getDocument\(\{data:bytes\}\)/);
 assert.match(ui,/Rendering first page/);
});
test('Canvas cache is bounded and keeps nearby rendered pages; avoid repeated redraw',()=>{
 assert.match(ui,/const maxCanvases=mobileQuery\.matches\?7:11/);
 assert.match(ui,/const visible=x\.offsetTop/);
 assert.match(ui,/if\(rendered\.length<=maxCanvases\)return/);
 assert.match(ui,/if\(visible\)continue/);
 assert.match(ui,/if\(epoch===renderEpoch\)pruneCanvas\(\)/);
 assert.match(ui,/requestAnimationFrame\(\(\)=>\{if\(pdfDoc\)scheduleRender\(\)\}\)/);
 assert.match(ui,/void engine\(\)\.catch\(\(\)=>\{\}\)/);
});
test('Mobile hides redundant Expand button and keeps Close at upper-right',()=>{
 const css=fs.readFileSync(path.join(root,'public/sjn-academy-resources.css'),'utf8');
 assert.match(css,/#module-resources\.sjn-r-reading \.sjn-r-viewer-actions \[data-r-expand\]\{display:none!important\}/);
 assert.match(css,/#module-resources\.sjn-r-reading \.sjn-r-viewer-actions \[data-r-close\]/);
 assert.match(css,/min-height:40px/);
 assert.match(ui,/data-r-close/);
});
