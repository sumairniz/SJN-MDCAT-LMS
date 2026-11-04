# 2026-11-05 — FIRST CONFIRMED HYBRID RANGE+STREAM BROWSER RESULT

**User screenshot:** Chrome mobile emulation, Biology One-Pagers 11,836,553 bytes, query `academyPdfRangeProbe=1`, diagnostic confirms `transportMode:"range-plus-stream"`. Measured since click: `authorizedMs=288`, `pdfjsReadyMs=290`, `r2FirstProgressMs=1084`, `parsedMs=23036`, `firstPagePreparedMs=23037`, `r2DownloadCompleteMs=40371`, `realFirstPageMs=64587`, `downloadedBytes=12058624`, `expectedBytes=11836553`, `server_authMs=28`, `server_dbMs=31`, `server_signMs=1`. Progressive parsing occurred **17,335ms before** reported full transfer completion, but the genuine first page was displayed **41,550ms after** page preparation; this gap needs instrumentation to distinguish page.render, queue/scheduling, and browser CPU contention. Reported traffic 12,058,624 bytes vs nominal file size 11,836,553. Note PDF.js progress measurements are not precise network bytes; do not treat this alone as evidence of efficient partial transfer.

**Comparison caveat:** Earlier two supposed A/B screenshots were **both** `stream-only`, with first-page times 138,120ms (auth 457, full transfer 124,578) and 140,149ms (auth 884, full transfer 107,634). Historical separate initial normal-run baseline 4,347ms. Different times/network conditions, no paired contemporaneous alternation → **no causal speed claim**; hybrid is not approved as default. Do not promote it. Proposed follow-up: instrument actual `page.render` start/end in numeric telemetry and compare three alternated same-network runs with existing original transport. Keep user-facing visuals and all other LMS modules unchanged. No source/R2 changes from this result.

---

# 2026-11-05 — STAGING HYBRID RANGE + STREAM EXPERIMENT (USER APPROVED)

**Status:** Instrumented, reversible staging A/B, **not a confirmed performance fix**. User approved proceeding. Baseline authenticated Biology PDF (11,836,553 bytes, 18 pages) first actual page was **4,347 ms**, full transfer complete at **3,893 ms**, auth **661 ms** (single browser capture; network may vary). Exact user re-upload SHA-256: `8fd48a1f95c2c3fe5840ae908dfddb5070a3ca22adabf9e94d5debe1b8ed1a27`; matching the private R2 object by hash still needs verification.

**Implementation (dev branch only):** In `public/sjn-academy-resources.js`, the existing streaming PDF.js call remains default (`disableRange:true,disableStream:false,disableAutoFetch:false`). A URL query flag `academyPdfRangeProbe=1` switches only the large-file PDF.js transport to `disableRange:false,disableStream:false,disableAutoFetch:false,rangeChunkSize:512*1024`. This is *not* the old unsuccessful range-only setting (`disableStream:true,disableAutoFetch:true`). A timing-only `transportMode` field distinguishes test cases; existing `authorizedMs`, `r2FirstProgressMs`, `r2DownloadCompleteMs`, `parsedMs`, `realFirstPageMs`, and `downloadedBytes` continue to track browser behavior. No UI design, API permission, bucket, object key, auth/session, exams, Courses or production change. Added regression tests and asset cache bust.

**A/B procedure** (use same account, Chrome profile, PDF and connection; fresh document open each time): open standard staging URL `https://sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app/index.html?sjnPhase4Preview=1`, navigate Academy Resources → Biology One-Pagers, then inspect `window.SJNResources.getLastOpenTimings()`. Repeat with `&academyPdfRangeProbe=1` appended to the URL. Capture `transportMode`, `realFirstPageMs`, `authorizedMs`, `parsedMs`, `r2DownloadCompleteMs` and actual `downloadedBytes`, plus page 2 and last-page navigation. Repeat 3x alternating order and compare medians; don't claim speed from just one run. Note browser caches / signed URL variability. The flagged version is for **benchmarking**, not automatic rollout. If hybrid is slower or causes extra R2 requests, revert to default.

**Source fidelity blocker:** QPDF is missing in the local container; local apt and direct download failed. PyMuPDF `linear=True` errors on the source. Ghostscript linearized an 11,388,550-byte candidate, but strict rendered-pixel equivalence fails around the CamScanner watermark; it was not uploaded or published. The original stays private and unchanged. Lossless conversion + private R2 derivative benchmark remain required before switching stored objects or integrating future Admin upload automation.

---

# 2026-11-05 — BIOLOGY ORIGINAL RECEIVED; LINEARIZED CANDIDATE VERIFIED (NOT PUBLISHED)

**Status:** Owner reattached source `Bio one pagers(STB) by S.J NIZAMANI (1).pdf` in this conversation, fixing the prior source-file access blocker. Exact local source size **11,836,553 bytes**, **18 pages**; not web-linearized. We have not verified its checksum against the private R2 original (matching size alone is insufficient).

**Local isolated test:** A Ghostscript 10.05.1 `pdfwrite -dFastWebView` conversion produced a separate **11,388,550-byte** (3.78% smaller) candidate. PyMuPDF recognizes it as web-linearized; its first-page section ends at **byte 578,351**, versus the original's cross-reference at the end. That difference makes progressive loading plausible, but it is **NOT a real R2/Chrome first-page speed result**.

**QA:** All **18/18 page sizes, extracted text and links** match. All **18 main full-page JPEG payloads** match the originals after excluding an extra JPEG EOI marker emitted by Ghostscript. A full-page pixel comparison at native 1997x3000 found **5,217 differing pixels out of ~107,838,000** (0.00484%). Most differences occur in the CamScanner watermark; page one also has a few small text-area rendering differences. **Strict pixel equivalence fails**, so this is a **visually near-equivalent benchmark candidate only, not a lossless production derivative**. The prior large MasterBook Ghostscript candidate remains rejected due to actual text substitutions. Do not confuse the two.

**Boundaries and next gate:** The current processing container does not have QPDF, cannot obtain new packages from the network, and no approved connected action accepts direct local raw binary transfer to the private Cloudflare R2 staging bucket. The PDF.js frontend still serves the existing original object and keeps the 4.347-second first-page baseline. There is **no demonstrated latency improvement**. Use qpdf on a trusted upload host to produce a truly lossless linearized derivative, compare text/images/annotations/pixels, stage it as a separate private R2 key, and measure the first genuine page via existing timing instrumentation before changing any object mapping. Do not alter unrelated LMS modules or production.

---

# 2026-11-04 — PHASES 1–2 INSTRUMENTATION & CONTROLLED PDF BENCHMARK (LATEST)

**User approval:** Proceed with true performance measurement and isolated linearized-vs-original benchmarks. No PDF viewer layout changes, no file-specific preview, no production release or modification to exams/Courses/History/AI Tutor. We must not claim a speed improvement until authenticated browser measurements demonstrate one.

**Implemented in staging:** Expanded `public/sjn-academy-resources.js` numeric per-open diagnostics through `SJNResources.getLastOpenTimings()`: `authorizedMs`, optional same-origin `server_authMs`, `server_dbMs`, `server_signMs`, `pdfjsReadyMs`, `r2FirstProgressMs`, `r2HeadersMs` (small path), `r2DownloadCompleteMs` when transfer reports completion, `parsedMs`, `firstPagePreparedMs`, and **`realFirstPageMs` after the actual canvas is attached**. PDF.js `onProgress` records the large-PDF byte transfer. No signed URL, secret or file key is returned by this diagnostic. Per-account diagnostics clear on close/reset; small-PDF memory cache behavior is unchanged. `tests/academy-resources.test.js` asserts the stages and isolation. Browser asset versions bumped to `20261104-resource-timings-v10`. The API already exposes `Server-Timing` for auth/metadata/sign. PDF.js streaming/reader design unchanged; ranges are NOT enabled solely based on conjecture.

**Controlled isolated large-file test:** User supplied `Biology MasterBooks 3rd Edition E-Books 2026.pdf`, 93,906,711 bytes, 385 pages, non-linearized and predominantly image pages. On a local offline processing host, Ghostscript 10.05.1 created a separate linearized candidate of **45,438,245 bytes** (51.61% smaller); the candidate's first-page section ends around byte **202,817**, whereas the original cross-reference pointer is around byte **93,822,249**. Both retain 385 pages; all page dimensions and link counts match. **QA rejected the Ghostscript candidate:** extracted text changed on pages **220 and 276** (some emoji/symbols substituted), and several sampled page images changed at pixel level. This is not a lossless copy, therefore it was **NOT uploaded to R2, did NOT replace an original, and is NOT live**. Size savings alone are not a safe optimization metric. The original uploaded MasterBook also remains outside the staging student library; do not publish third-party content without rights/approval.

**Next acceptance gate:** Run generic `scripts/prepare-academy-pdf.py` (QPDF lossless, with input/output validation) on a trusted upload host with the actual original 7 KiB Physics, 43 KiB Biotechnology, 11.8 MB Biology and approved large-file test. Check file text, page counts, links, geometry, original checksums, and rendering. Then compare original vs private derivatives under the same authenticated R2/Chrome/Android network conditions using the above *real-page* telemetry. Only switch the stored object key if fidelity/security and repeatable browser performance both pass; otherwise keep original. Future Admin processing must use the generic workflow; it has not been wired to an Admin Panel. **No measured live first-page acceleration is claimed.**

---

# 2026-11-04 — OWNER-APPROVED REAL PDF PERFORMANCE WORK, STAGING (CURRENT)

**Status: source and staging implementation in progress; real browser latency and existing PDF web-optimized derivatives NOT yet confirmed.** Owner rejected the PDF-specific first-page JPEG workaround and approved authentic, uniform loading improvements with no effect on other LMS features.

## Implemented (dev branch)
- Removed the Biology-only preview mapping/URL from `lib/academy-resources.js`, first-preview overlay and its styles from `public/sjn-academy-resources.js` and `public/sjn-academy-resources.css`. The existing private JPEG derivative stored in R2 is orphaned and not requested by the LMS; original PDF unaffected. No change to layout, scrolling, zoom, page controls.
- File/open endpoint now normally embeds `academy_resource_folders(id,is_published)` in the authenticated file metadata read, replacing a separate serial Supabase read. Existing RLS applies to both resources; if folder missing/unpublished, fail closed with 404. If PostgREST relationship embedding fails (schema/cache mismatch), fallback to the original explicit file+folder verification path, with identical authorization. **No authentication bypass or global auth middleware change**.
- `Server-Timing` on successful authenticated resource open reports only numeric durations for `resource-auth`, `resource-db`, and `resource-sign`, without exposing tokens or document storage keys. Frontend `window.SJNResources.getLastOpenTimings()` returns numerical times since click for authorization, actual PDF parse and actual first PDF.js canvas rendering (or failure). These are performance diagnostics, not student-visible interface changes. PDF.js still uses existing single streaming GET for >=1 MiB PDFs and existing <=256KiB session cache for small PDFs, because previous demand-only range experiment regressed owner-observed performance.
- `scripts/prepare-academy-pdf.py` is a **generic** qpdf-driven linearization/validation step that accepts any uploaded eligible PDF, writes a *separate file*, validates integrity/linearization, hashes inputs/outputs, and refuses original overwrite. It is designed for the future Admin upload pipeline, on a trusted processing host with qpdf installed. It is NOT yet wired to an Admin Panel (not available) and existing R2 PDFs have NOT been converted or replaced. Source PDF contents must be checked after conversion; no presumption of greater speed or smaller file size.
- Focused tests assert old preview is gone, actual-page timing exists, and security-preserving joined query is present; static assets refreshed. No changes to MCQ, Courses, Test History, AI Tutor, test engine, Supabase schemas/data, domains, environment secrets or production.

## Verification still required before owner acceptance
1. Check GitHub Foundation CI and Vercel deployment READY on final dev SHA; use preview-only.
2. Browser real-world timings for each of 7 KB Physics, 43 KB Biotechnology, 11.8 MB Biology: cold/warm start, regular/throttled mobile networks; compare time to actual first canvas and complete page navigation, not fake preview. Inspect Preview response `Server-Timing`, browser Network waterfall and `SJNResources.getLastOpenTimings()`.
3. On trusted host, run generic qpdf preparation for each original, compare checksums, PDF page counts and rendered fidelity, upload new optimized derivatives under private R2 keys, and then update records to deliver optimized copies **only after measured improvements**. Original R2 PDF keys must remain recoverable. Future Admin Panel must call the same process when accepting new uploads. The existing hosted originals are unchanged at this checkpoint.
4. Verify published/unpublished folder access, logout/account changes, signed URL expiry; all student LMS workflows unchanged. Never report milliseconds or complete fix without owner browser UAT.

---

> **2026-11-04 latest adjustment (supersedes the range-loader setting below):** After a user recording showed slower full-PDF readiness (~9.4 s) using demand-range, the owner-authorized implementation has restored the previously recorded faster **single streaming full-PDF** mode (`disableRange:true`, `disableStream:false`, `disableAutoFetch:false`) behind the *separately signed private JPEG first-page preview*. The first page may now become readable before PDF.js is ready while complete PDF rendering continues. Focused tests updated; CI/Preview and owner real-device measurements are independent gates. Do **not** claim the earlier demand-range loader remains active. Changes: `f6f085f9` / `a3299024`. No PDF originals altered. First-load performance is **not confirmed** until tested.

# 2026-11-04 — PRIVATE EARLY-FIRST-PAGE PERFORMANCE REPAIR (OWNER APPROVED; STAGING UAT PENDING)

**Priority and scope:** User rejected the previous demand-range change after recording approximately 9.4 seconds to the first readable page of the 11.84 MB Biology One-Pagers PDF. Owner explicitly authorized further performance repair, but locked **all** existing visual layout and reader controls and prohibited effects on any other LMS feature. Production and `main` remain off limits.

**Root cause evidence from real source object (not guesswork):** R2 original `biology-resources/biology-one-pagers-stb-sjn.pdf` is **11,836,553 bytes**, 18 pages, PDF 1.7 from CamScanner and **not linearized**; its cross-reference table is at the very end and original full-page first JPEG is an embedded DCT image in object 11, 1997×3000 pixels, **566,540 bytes**. The old reader waited for PDF.js `getDocument().promise` before rendering the first page; demand range alone could therefore still require slow PDF header/cross-reference/network parsing. R2 original remains unchanged.

**Applied owner-approved narrow change:**
- Extracted the **exact original page-one JPEG bytes** from R2 PDF object 11, validating JPEG SOI/EOI and declared dimensions. Stored a distinct **private** object `academy-previews/biology-one-pagers-stb-sjn-page1.jpg` (566,540 bytes; MIME image/jpeg) in the same private bucket `sjn-mednest-academy-resources`. No PDF rewrite, no quality reduction or change to page content. No public R2/custom domain.
- `lib/academy-resources.js` generates a second **180-second presigned GET** `previewUrl` only for an exact reviewed PDF object key after the existing authenticated, published-file, published-folder and secure-PDF-key checks pass. The original signed `url` and response stay available. Arbitrary resource keys cannot mint preview URLs.
- `public/sjn-academy-resources.js` immediately loads the private first-page preview in parallel with the existing PDF.js full reader. Once the image loads, it appears in the existing reading surface, hiding the “Opening document” overlay. When page 1 is actually rasterized by PDF.js, the preview disappears and ordinary continuous scroll, zoom/pinch, page navigation and bounded canvas behavior continue unchanged. On image failure the existing PDF path remains functional; on account change/reader close old session DOM is destroyed. `referrerpolicy=no-referrer` keeps signed URL out of Referer. Only the Academy Resources module uses this.
- `public/sjn-academy-resources.css` adds a strictly scoped, no-interaction overlay. **No redesign of folders, desktop modal or mobile full-screen reader.**
- `public/index.html` resources asset versions advanced to `20261104-firstpage-v8` for browser refresh. `tests/academy-resources.test.js` includes preview/privacy/unchanged fallback assertions. Previous small-PDF per-account session cache and on-module PDF.js warm-up remain.
- GitHub CI and Vercel Preview readiness must be checked at the final commit; real first-page time must be measured by owner under normal and slow connections. Existing screenshots/recording are evidence of pre-fix failure only. Do not claim instantaneous browser loading or production readiness without measured evidence.

**Explicit isolation:** No Supabase tables/records/migrations, student auth changes, test engine, courses, Past Papers, Test History, AI Tutor, region settings, unrelated CSS, domain, environment variables or Production changes. Existing R2 PDF object preserved; only one new **private R2 JPEG derivative** added.

**Owner UAT request:** On Desktop Chrome/Android open Biology 11.84 MB cold, note time to **first readable preview** and time until full PDF features work; test scrolling page 2 and back, pinch/zoom, reopen, close, logout/account change. Test Physics Syllabus (~7 KB) and Biotechnology Notes (~43 KB) first open/reopen, slow network, and ordinary LMS exam navigation. Preview can be faster than full PDF readiness; never confuse those metrics. Report remaining delay if visible. A later more general derivative generation workflow needs separate design/approval. **STATUS: staging optimization implemented; browser speed/regression acceptance PENDING.**

---

# 2026-11-04 — OWNER-APPROVED ACADEMY RESOURCES PERFORMANCE REOPEN (STAGING ONLY)

**Owner observation/approval:** Desktop recording of the 11.84 MB Biology One-Pagers PDF showed roughly 5 seconds before its first readable page on a fast connection. Owner also reported noticeable delays on small-KB PDFs and negative student feedback on slow networks. The earlier staging feature acceptance is superseded **only for PDF load performance**, not approved UI/functionality. Owner explicitly approved a focused overall Academy Resources performance repair, with existing exam, courses, history, AI Tutor, auth, R2 privacy and all production systems protected.

**First staged, incremental change** (commits `3f80a14d`, `d36f0913`, `385691aa`):
- `public/sjn-academy-resources.js`: >=1 MiB PDFs now use PDF.js *demand-driven range loading*, `disableRange:false`, `disableStream:true`, `disableAutoFetch:true`, 1 MiB chunks, instead of the prior full streaming GET. This avoids eagerly fetching unneeded large pages when R2 supports Range. It is a hypothesis to measure, **not yet proven faster**; for PDFs whose first-page structures are late in the file it may still need extra range requests. PDF.js may fall back when origin lacks range support.
- Smaller PDFs retain their full-byte reader path, but after successful authenticated `/open` authorization a max-four-document, <=256 KiB/file **in-memory, account-session-only** cache can avoid repeated small-file R2 GETs on reopening. Cache clears on reset/logout/account change; failed opens evict; no persistent storage, service worker, background PDF preload, public URL or bypass of the short-lived signed R2 authorization. No cache for the 11.84 MB Biology PDF.
- PDF.js import warming starts immediately upon entering Academy Resources, in parallel with catalog fetch, never on Dashboard/exam routes. `public/index.html` cache-busting updated. Existing reader controls, continuous scrolling, page cache, mobile gestures and R2 originals are preserved.
- `tests/academy-resources.test.js` updated for this new path, release/syntax/CI checks must pass. Initial CI failure at code-only commit was expected from the old assertion of the previous streaming setting; verify updated CI on the final files.

**Security and limitations:** R2 source objects, Supabase schemas/data, Cloudflare policies/credentials, Vercel environment variables and Production remain unchanged. Do not infer measured first-page improvements from source-level optimization. Do not claim linearization, reduced PDF file size, generated previews, or network benchmarks—none have been performed. A truly first-page-fast path on slow networks may require a separate approved lossless web-linearized derivative/secured page preview after measuring the actual client-side waterfall. Access to the 11.84 MB original raw bytes was not available to this work session; no PDF object migration was attempted.

**Owner UAT after CI/Preview READY:** Hard refresh Preview; signed-in desktop/Android: first-open Biology 11.84 MB time from tap to readable page, scroll page 2+ and backward, small Physics Syllabus and 42 KB Biotechnology first open and reopen, slower network / network throttling, close/reopen, zoom/pinch, logout/login different account and verify no stale cross-account viewer; ensure MCQ/Test History/Courses unaffected. Report measured times and any blank screens or repeated requests. If still slow or broken, preserve last known good Preview commit and isolate the next remedy; do not merge into main. **Status: IMPLEMENTED ON DEV — AUTOMATED/OWNER UAT PENDING, NOT ACCEPTED SPEED IMPROVEMENT.**

---

# 2026-11-03 — ACADEMY RESOURCES STAGE CLOSED / ACCEPTED FOR NOW

**Owner decision (LATEST — read first):** The owner reviewed the latest Academy Resources UI and PDF performance repairs, reports that the overall feature now seems satisfactory, and explicitly requests **FINALIZE THIS FEATURE and move to the next feature**. The owner's network is currently unusually slow, so real-world PDF loading speed is **NOT conclusively validated**. Owner will independently repeat the speed test when internet is faster (e.g., at night) and report back. Treat this as **development milestone accepted/closed with ONE deferred network-dependent performance UAT check**, not as confirmation of a specific loading time or that the feature has been promoted to Production. No further modifications are authorized now.

**Accepted staging scope:**
- Modern full-width interactive LMS-style folder/collection and PDF cards; Digital Library top label; two user-named folders, three private R2 PDFs.
- Desktop centered PDF modal with dimmed background, Expand/Restore, continuous vertical scrolling, page navigation, zoom/percentage, and fit.
- Mobile full-screen PDF reader with compact Close control (no redundant Expand), continuous vertical scrolling rather than page-snapping, pinch zoom, navigation, zoom percentage.
- Private R2 storage and authenticated signed URLs, restricted Cloudflare CORS; original PDF quality preserved.
- Most recent performance repair: large PDFs use a single streaming request instead of many small range calls; bounded cache of recently rendered pages avoids unnecessary re-rendering when scrolling back; PDF.js warms only upon entering Academy Resources, not on other LMS modules; no loading percentage.
- GitHub automated checks and latest Vercel Preview build were reported passing/READY after the repair; user confirms design and core reading behavior look satisfactory.

**ONLY OPEN FOLLOW-UP — not blocking feature closure:** When the owner's connection becomes normal, retest the ~11.84 MB Biology One-Pagers PDF on Android and desktop: (a) elapsed time until first readable page, (b) time/behavior scrolling forward to page 2+, (c) backward scrolling should not reload nearby already-viewed pages, (d) compare smaller Physics Syllabus and Biotechnology PDFs. Do not claim measured speed improvement until this is verified. If poor performance persists under stable network conditions, reopen *only the PDF performance subtask* with the owner's approval; investigate with timing and consider PDF web-linearization/serving strategy, keeping private access and PDF quality.

**Guardrails:** Close Academy Resources stage **only on dev branch** `sjn-phase1a-foundation`; **do not merge/promote to Production, alter R2 objects, or change code** as part of documentation finalization. Preserve Mumbai deployment/location, examination engine, test history, Supabase, courses, Past Papers, performance and security boundaries. All further code changes require explicit owner approval.

**Next chat workflow:** First read this section and the top of `docs/SJN-LMS-MASTER-DEVELOPMENT-PLAN.md`. Academy Resources is accepted/closed for current staging phase, with a deferred internet-speed UAT. Ask owner which **next feature** to discuss; do not reopen Academy Resources or start implementing an unspecified next feature on your own. Branding discussion uses **SJN MedNest Academy / SJN MedNest LMS Pro** (legacy interface text remains until separate branding approval).

---

# 2026-11-03 — CURRENT CHECKPOINT: approved loading and repeated page-render fix

**Owner approved this performance-only change** after reporting large image-heavy PDF loading taking 2–3 minutes, no benefit from previous ranged loading, and later PDF pages showing another separate loading delay after page 1. Do not alter accepted mobile header, desktop modal/expand, continuous scrolling, cards, pinch zoom, other LMS modules, or Production. This section supersedes the earlier large-PDF "range optimized" notes below.

**Diagnosed from source:** The previous large PDF path used PDF.js `rangeChunkSize:512*1024`, `disableStream:true`, `disableAutoFetch:false`, permitting many network requests and, on errors, potentially a second full-object GET. Separately `pruneCanvas()` discarded canvases more than two viewport heights away *on every scroll*, forcing the browser to rerasterize when revisiting earlier pages. Rendering is one canvas/page and browser/phone memory must remain bounded. This was confirmed from source, not by measured device timings.

**Changes made:**
- `public/sjn-academy-resources.js`: large files (>=1 MiB) now use one PDF.js streaming GET (`disableRange:true`, `disableStream:false`) through the *existing* private R2 signed URL instead of 512 KiB range downloads and full-GET fallback. Removes percent indicator; loading status is simple. Small PDFs keep previous existing full-GET path, with PDF.js library import started in parallel.
- Rendering cache keeps up to 7 mobile or 11 desktop *recent page canvases*, preferentially retaining visible/nearby pages to avoid repeated work on minor backward scrolling, evicting distant pages only after exceeding budget. The PDF document itself remains open while reading. Multiple pages are still rendered on demand; far-away pages may legitimately take time when first visited.
- Stop infinite rerender loops on an individual page render error. Make render queue recover if zoom cancels an older render task. Warm PDF.js library **only after student enters Academy Resources**, not when visiting Dashboard, exam modules, history or courses.
- `tests/academy-resources.test.js` covers single streaming download, bounded canvas cache, queue recovery, and mobile Close header. `public/index.html` asset versions bumped to `20261103-stream-v6` so Preview reloads new JS.
- No PDF source object was changed, compressed, publicly exposed, or re-uploaded. The previous restricted Cloudflare R2 CORS entry remains in place (GET/HEAD scoped to staging). No changes to Supabase, Vercel env vars, server auth, or production.

**Caveats and user acceptance:** The speed gain is *not yet confirmed* on a real phone or network. An unlinearized/image-heavy PDF may still need large portions of its data before first render; network bandwidth, PDF structure, and browser memory remain limiting. A streaming GET may be better or worse depending on file layout. User must test the 11.84 MB Biology One-Pagers and smaller Physics/Biotechnology files, compare first-page time, scroll through multiple pages and backwards, see whether double-loading persists, verify desktop/mob loading and old PDF controls. If still unacceptable, next investigation should consider a losslessly linearized/web-optimized R2 derivative and first-page streaming, but require measured evidence and compatibility testing before replacing any objects.

**Staging:** repo `sumairniz/SJN-MDCAT-LMS`, dev branch `sjn-phase1a-foundation`, Preview alias `https://sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app`. Check latest GitHub Actions and Vercel deployment status before calling ready. Owner must review actual Android/desktop UX. Production and core exam features untouched.

---

# 2026-11-03 — LATEST: Owner-approved mobile-header and large-PDF speed adjustment

**Approval scope:** Owner approved ONLY (1) remove mobile-only redundant Expand button, keep Close at top-right; (2) improve 11.84 MB/image-heavy PDF opening speed without reducing image quality or relaxing private access. Everything else should remain unchanged. A network/chat interruption occurred during the first attempt; an explicit GitHub check showed no partial edits had landed, and work resumed safely.

**Implemented on staging branch `sjn-phase1a-foundation`:**
- `public/sjn-academy-resources.css`: mobile-only `[data-r-expand]` hidden; mobile Close button sits at the top-right with compact single-row PDF title (truncated when long). Desktop Expand/Restore unchanged.
- `public/sjn-academy-resources.js`: small PDF objects (less than 1 MiB) retain the existing full-fetch in parallel with PDF.js import. Larger PDFs use PDF.js `getDocument({url, rangeChunkSize:512*1024, disableStream:true, disableRange:false})` to request partial content progressively through the existing private, short-lived, authenticated R2 presigned URL. On range/progressive failure, reader retries existing full-fetch path. Status text reports preparation/loading and first-page rendering. **No PDF compression or file reupload**, so no reduction in image/text quality; rendering remains lazy near the viewport.
- Cloudflare **private** bucket CORS rule `Academy staging PDF reader` updated ONLY to add `Range` in allowed request headers and expose `Content-Range`, `Content-Length` and `Accept-Ranges` for the exact staging branch origin. GET/HEAD only; public bucket access unchanged.
- `tests/academy-resources.test.js` extended with regression coverage for both fixes; `public/index.html` static asset versions bumped for reliable browser refresh.
- No MCQ engine, Test History, Courses, Past Papers, Supabase data, R2 objects, main auth, or production edits.

**Important UAT:** Test 11.84 MB Biology One-Pagers on Android/mobile network and desktop, including first-page time and scrolling through later pages. PDF.js partial loading depends on source PDF layout, browser, CORS, and availability; performance improvement is a *goal* and not guaranteed for all PDFs, especially non-linearized image-heavy files. Confirm small Physics and Biotechnology PDFs still open as quickly as before. Test only one Close in upper-right on mobile, desktop Expand/Restore unchanged. The R2 signed URL lasts 180 seconds; very slow/reopened downstream requests may require future token refresh architecture (NOT changed here). Collect actual loading times/device results before claiming speed success. Previous working continuous scroll, pinch-to-zoom and card design preserved.

**Status:** Changes committed; GitHub Actions runs for updated code already succeeded; last static-version bump / docs commit deployment and tests must be inspected before final acceptance. User visual UAT pending. Read this section first in Chat 7. Changes outside these two items require fresh user approval.

---

# 2026-11-03 — APPROVED continuous reader upgrade (current)

**User approved implementation**, including these refinements:
- Move "DIGITAL LIBRARY" with its layer icon to the yellow eyebrow above Academy Resources; remove previous "STUDY RESOURCES" and duplicate Digital Library label in folder panel.
- Eliminate desktop permanent side PDF viewer and its empty placeholder. Show full-width modern collection/PDF cards. Selecting a PDF opens a **centered modal reader** against a dim backdrop, with Expand/Restore and Close.
- Add desktop visible page number field, previous/next buttons, percentage input, Zoom In/Out and Fit, keyboard page navigation, Ctrl+mouse-wheel zoom. Keep scrolling natural.
- Android/mobile compact full-viewport reader, manual zoom shown as a percentage, touch pinch-to-zoom, and **continuous vertical scrolling** (Google Drive-like), NOT horizontal swipe-based page flips: intermediate scroll positions can display parts of adjacent pages. Page field still allows jumps.
- Maintain private Cloudflare R2 signed links and authenticated metadata, lazy resource loading, hidden visible download buttons (NOT DRM), no changes to Supabase data or exam/history/course APIs.

**Staging code:** `public/sjn-academy-resources.js` now shares a PDF.js canvas-based renderer for both desktop and mobile, creates a page stack with viewport-near rendering and distant-canvas cleanup, modal PDF toolbar, zoom and keyboard controls; `public/sjn-academy-resources.css` adds full-width catalog/centered desktop modal/fullscreen mobile reader; `public/index.html` moves eyebrow and refreshes JS/CSS asset versions; `tests/academy-resources.test.js` updated for continuous rendering. Current base developer source prior to docs commit: `424b60c8f28ac123b9467f598773f2a5922aa004`. **CI and user UAT are not yet assumed pass** until explicitly verified. Keep production unchanged.

**Important performance caveat:** desktop previously used fast browser-native PDF iframe, now a custom PDF.js renderer is used for page/zoom control and seamless scroll. This changes loading behavior; check the large 11.8 MB Biology file and desktop opening speed (owner values speed highly). No need to preload resources on other modules. PDF.js is lazy-imported only when a file is opened. Mobile multi-page rendering requires testing on actual Android browser. Rendering pages on demand with canvas reuse should cap memory, but must confirm performance and navigation.

**Requested QA (owner acceptance):** desktop catalog/collection cards, popup dimensions and dim background, Expand/Restore/Close, page number direct navigation, zoom percentage and ctrl-wheel, continuous scroll halfway between pages; Android browse/reader full width and height, pinch/scroll, long PDF, exit to Files, browser back, landscape. Check no visible Download action; students may still save via developer tools/screenshots. Full regression: no changes to MCQ, Course, Past Papers, History and Mumbai `bom1`/Supabase `ap-south-1`.

**Next chat:** Continue SJN MedNest Academy, open this document first on `sjn-phase1a-foundation`, inspect latest CI/deployment and perform UAT fixes. All requested changes in this section were owner-approved; new scope changes require new approval.

---

> **2026-11-03 card-redesign QA:** Latest implementation commit `2a6462b4acbb3aec08ac4f1961fb16bbc5b0be47` passed both Foundation Checks GitHub Actions runs. Vercel Preview build of this SHA is READY (`sjn-mdcat-o3q83l0nn-sjn1.vercel.app`). Interactive collection and PDF cards and flat mobile shell are implemented; **user visual and Android UAT remain pending**. No production changes; older notes below are history. Desktop zoom gestures and mobile pinch/swipe remain separately pending approval.

# 2026-11-03 — NEW APPROVED Academy Resources card redesign (current)

**Latest approval:** User explicitly authorized implementation of modern, attractive, interactive **LMS-style collection cards** modeled on the interaction quality of existing My Courses and Past Papers cards, plus similarly interactive PDF resource cards. Plain file-manager folder styling was rejected. User emphasized no interference with core LMS features. This supersedes the prior UNAPPROVED designation for **card styling and flattening** below; the historical section remains for context.

**Implemented on dev branch `sjn-phase1a-foundation`:**
- `public/sjn-academy-resources.js`: replaces basic folder/list rows with semantic `button` collection tiles and PDF tiles, folder names/counts, visual categories, hover/active/focus states, Read/Explore actions. Same existing authenticated metadata and PDF-open endpoints, IDs, hierarchical folder logic; no new data fields are required.
- `public/sjn-academy-resources.css`: per-card subtle accent treatments, decorative geometry, two-column desktop tiles where space allows, one-column mobile cards, no extra nested outer/page cards on mobile, compact library heading and improved reader width. Keeps desktop two-column reader split and existing browser/PDF.js display logic.
- `tests/academy-resources.test.js`: regression assertions for new card surfaces and module isolation. Run GitHub CI for current head and owner desktop/Android UAT after deployment.
- No Supabase schema/data edits, R2 bucket/permission changes, Vercel settings changes, server APIs, test engine, history, courses, or Past Papers edits. Only Academy Resources front-end and its tests.

**Preserve:** fast native desktop PDF + Expand/Restore, Android PDF.js canvas reader and actual open, private R2 signed URLs and no visible download buttons, Mumbai `bom1`, lazy loading unrelated to exams.

**Still pending approval / NOT part of this UI card implementation:** Android pinch-to-zoom, swipe page/drag gestures; visible desktop mouse/Zoom/Fit controls; larger immersive reader toolbar architecture. Prior discussion recorded as requests, but latest approval specifically covered card design and flattening. Await separate owner sign-off after testing. Do not claim completed or quietly implement.

**Review:** confirm mobile collection cards fill width, no nested box waste; selected folder header on desktop remains, PDFs are obvious interactive cards; test all three PDFs plus desktop/mobile Expand, Files/back, core exam history. Production branch remains untouched. Design is not owner accepted until screenshots/UAT.

---

# CURRENT CHECKPOINT — Academy Resources (2026-11-03; design review only)

**Read this section first in a new chat.** It supersedes older setup/blocker status notes below. The **latest user message authorizes DOCUMENTATION UPDATES ONLY**. There is **NO APPROVAL** to implement the next UI/UX redesign, change CSS/JS, add gestures, modify Cloudflare/Supabase/Vercel, or deploy. Ask for explicit approval before implementation. User rejected the prior AI-generated image as an unnecessary preview; use ordinary chat mockups/wireframes and direct explanations if proposing another design, not an image.

## What is implemented and working (owner screenshots, 2026-11-03)

- Brand in intended project discussions: **SJN MedNest Academy / SJN MedNest LMS**; legacy UI still says "SJN MDCAT LMS PRO" (global rename deferred; not in scope).
- Repo: `sumairniz/SJN-MDCAT-LMS`; branch: `sjn-phase1a-foundation`; tested code HEAD **`f78f24fc9e5b1372bb77982b2885b1450370fc29`**. GitHub Actions completed successfully for this commit (two runs). Documentation-only commits may follow.
- Staging Preview alias: `https://sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app`. Vercel functions in Mumbai `bom1`; Supabase staging project `aozknkrwafowsrehdwlr` in Mumbai `ap-south-1`. Do not touch production.
- Cloudflare private R2 bucket `sjn-mednest-academy-resources`, Standard/APAC; public access disabled. The scoped **Object Read** S3 credentials are safely stored as sensitive Vercel Preview environment variables, restricted to this branch, alongside `R2_ACCOUNT_ID` and `R2_BUCKET_NAME`. Never retrieve, expose, copy, or display secret values.
- Academy Resources is lazy-loaded independently of the MCQ bootstrap; `server.js` + `lib/academy-resources.js` authenticate student sessions and issue short-lived private PDF links. No resource loading on unrelated pages; preserve exam/history/review speed and behavior.
- Two published user-named folders in Supabase staging: **MDCAT Syllabus by SJN** and **Biology Resources**. Three published owner-supplied PDFs uploaded to private R2:
  - `mdcat-syllabus/physics-syllabus-2026-sjn.pdf`
  - `biology-resources/biotechnology-notes-stb-ftb-kpk-ptb-sjn.pdf`
  - `biology-resources/biology-one-pagers-stb-sjn.pdf`
  Keys have NO `pdfs/` parent. No re-upload needed.
- `public/index.html`, `public/sjn-academy-resources.js`, `public/sjn-academy-resources.css`, `tests/academy-resources.test.js`: larger title, redesigned folder cards, desktop native PDF iframe and Expand/Restore; Android now uses on-demand PDF.js page canvas reader instead of native iframe; Files/back, next/previous page buttons, manual zoom, Expand/Restore. Preview runs and owner supplied screenshots confirming **actual desktop AND Android PDF rendering**, including mobile expand. The earlier issue with Android showing only an "Open" button is resolved.
- Owner likes **fast desktop PDF opening**, desktop Expand, the "Digital Library" selected-folder name/header, and that PDF files now open inside mobile LMS. Keep these wins.
- Download buttons are hidden in viewer where supported, but web PDF bytes can still be saved or screenshotted; do not promise DRM.

## UNAPPROVED next-phase requirements — DISCUSSION / DESIGN ONLY

User's latest screenshots plus MedSindh comparison clarified **real UX problems**:

1. **Mobile nested-card waste:** Existing `#module-resources` uses an outer `bg-sjn-card ... p-6` shell. Inside it, `.sjn-r-library` includes another bordered `#resources-container` and an inner `.sjn-r-browser-head` panel, then folder cards. On a narrow phone there are boxes within boxes and excessive padding/margins, which compresses the actual list and reader. This is not a request for *more* decorations. User wants **less chrome, greater usable PDF width/height**, and a clean, professional modern app feel.
2. **Mobile browser/read transition:** Library should show folders/files prominently, then open a **dedicated reading surface**; while reading, eliminate redundant page heading, outer cards, borders, and side padding. Use the usable viewport. A concise reader header and unobtrusive controls, not several stacked rows of space-consuming headers. Keep easy Files/back and expand/restore.
3. **Mobile natural gestures:** Pinch-to-zoom, drag/pan when enlarged, swipe horizontally between PDF pages (without accidental page switches during panning or vertical reading). Keep accessible button alternatives for paging/zoom. Current PDF.js canvas only has discrete zoom buttons and previous/next controls, so this is **NOT YET IMPLEMENTED**.
4. **Desktop PDF control parity:** User wants visible zoom + / -, Fit/Reset and mouse-driven controls (such as Ctrl + wheel zoom) in addition to existing keyboard/touchpad behavior. Desktop current `iframe #toolbar=0` hides native PDF toolbar, so explicit zoom controls are currently absent. Keep fast desktop initial load/Expand, and verify technical feasibility/performance of custom zoom before modifying the engine. This is **NOT YET IMPLEMENTED**.
5. **Visual quality:** Current redesign is improved but not yet accepted. Maintain minimal consistent red/charcoal SJN MedNest theme, informative folder names and counts, obvious selected state, legible typography, crisp icons, responsive density; compare reference screenshots for interaction quality only, **do not copy a competitor's branding/design exactly**.
6. **Download suppression:** Keep visible download/print actions hidden, with honest statement that web display cannot prevent saving or screen capture.

**Options for mobile shell (not implemented):**
- A, **recommended**: *Flat/canvas page layout*. Academy Resources title as normal page heading only while browsing. Folders/files sit on the original page background with one meaningful surface/card per item and no large outer bordered cards. PDF reading uses a full-width, viewport-based in-app viewer without external page/card padding. Header/controls compact; optionally sticky or auto-hide while reading.
- B: *One container*: Keep a single light page surface around library items, remove inner wrapper and decorative browser-header card. Reader still uses separate immersive surface.
- C: *Hybrid*: Minimal outer page heading and compact folder section, but expanded PDF takes over viewport immediately on mobile.

**Recommended direction:** A for mobile with meaningful card only per folder/document; preserve desktop two-column library with a compact selected-folder label and fast reader. The large `Academy Resources` page title should remain visible on the browse screen, not occupy reading space. Start design review with simple chat wireframes rather than image generation; do not start coding until owner approves.

## Implementation/QA plan AFTER approval (not authorized now)

- Scope changes to Academy Resources page/JS/CSS and dedicated tests. Do not touch unrelated exam, history, courses, auth, production, or R2 permissions unless there is a demonstrated technical need and separate approval.
- Mobile: flatten outer wrapper (likely responsive CSS and slight index.html markup), single-column folder/document browsing, compact full-width viewer, pinch gestures/pan/swipe with safeguards. Consider the browser's own scroll/pinch behavior and accessible fallback.
- Desktop: preserve fast iframe if possible, offer appropriate zoom controls without destroying fast render; avoid large PDF.js desktop migration unless justified and approved.
- Test real Android (regular + expanded, 2/5/18-page PDFs, pinch/drag/swipe, Files), desktop mouse wheel/zoom/scroll + Expand/Restore, orientation changes, slow network, logout/session changes, long PDFs; compare loading speed and confirm no regressions to exam modules.
- Run CI, deploy Preview branch only, update this handover and Master Plan with accurate test results; get owner's acceptance before marking stage closed.

## Decision register (as of current message)
- **Approved and implemented:** first Academy Resources feature; private R2; two folders/three PDFs; initial folder redesign; Android PDF.js reader; hidden visible Download; staging environment integration.
- **Liked by user, PRESERVE:** desktop fast viewer and Expand; selected folder title in Digital Library; actual in-LMS mobile reading.
- **Requested but NOT approved for coding:** remove/flatten nested mobile cards; use more phone screen width/height; immersive compact reader; pinch zoom/pan/swipe; desktop visible zoom and mouse zoom; additional refinements inspired by references.
- **Pending decision:** precise flat-versus-one-shell mobile design; toolbar placement/auto-hide; swipe versus continuous scroll behavior; desktop zoom engine strategy; final visual sign-off.
- **Deferred:** Academy Admin Panel management, native videos/lectures, global rename, production launch/conversion; no dummy course cleanup or unrelated changes now.

## Chat 7 continuation script
"Continue **SJN MedNest Academy** on GitHub `sumairniz/SJN-MDCAT-LMS`, dev branch `sjn-phase1a-foundation`. Read `docs/ACADEMY-RESOURCES-HANDOVER-2026-11-03.md` **CURRENT CHECKPOINT** and the Master Development Plan. We are DISCUSSING a pending Academy Resources mobile/desktop redesign; no UI changes are approved yet. First discuss the flat mobile browse layout, immersive PDF reader, pinch/swipe and desktop zoom. Do not edit code or deploy without my explicit approval."

---

## ARCHIVED EARLIER HANDOVER — historical states; superseded above

> **2026-11-03 latest deployment checkpoint:** Owner created R2 bucket-scoped Object Read S3 token and saved both `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` as Vercel **Secret**, **Preview** limited to `sjn-phase1a-foundation`. Connected Vercel API independently verified all six Preview variables by name and target WITHOUT decrypting them. Fresh forced Preview deployment `dpl_8QejSf1YNik8pfuFPfwEz5t7QgLK` READY, Git SHA `23d37275996b57cf526e92f20f6ba83a8cc131d3`, region `bom1`, branch alias `https://sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app`. All three object keys verified in private R2 against staging metadata. All three `academy_resource_files` rows were marked published = true for signed-in student UI testing; folders already published. **Important: credential validity, a live authorized PDF retrieval, browser iframe rendering, and desktop/mobile UAT are NOT yet verified.** Owner should sign in on Preview, navigate Academy Resources, open all 3 PDFs and send feedback; if any request fails inspect Vercel logs and signed URL behavior, unpublish if necessary. Production untouched. Documentation continues in this branch.

# Academy Resources — current handover and next-chat checkpoint (2026-11-03)

> **Status: STAGING IMPLEMENTED, PRIVATE PDF OBJECTS VERIFIED, LIVE PDF VIEWER NOT YET READY / OWNER UAT NOT PASSED.** This file is the authoritative current Academy Resources checkpoint. Earlier dated notes in the Master Plan represent historical states and must not be mistaken for present blockers.

## 1. Owner-approved design and operational constraints
- Product: **SJN MedNest Academy**, Academy Resources module; no global legacy UI rename yet.
- Professional larger “Academy Resources” heading. Desktop: folder explorer left, selected PDF viewer right, expandable/fullscreen-style reading. Mobile: responsive stack, expandable reader. Owner hasn't signed off with live PDFs.
- Arbitrary admin-defined folders and nested folders; no forced Biology/Chemistry taxonomy. Future Admin Panel manages folders, PDF uploads, publication, deletion. No lecture/video backend, just optional YouTube tutorial links later.
- Main auth, MCQs, courses, tests, results, manual Save & Exit, Review, Retake, Test History remain unchanged; **speed first**. Preserve Vercel function Mumbai `bom1` and Supabase Mumbai `ap-south-1`. Resources must not be queried/fetched during MCQ bootstrap or other unrelated module navigation.
- Never change production without separate owner authorization. No R2 public domains, no secrets in repo/client/chat/screenshots. Explicit owner approval granted for this staging feature and its continued completion.

## 2. Environment and infrastructure (verified 2026-11-03)
- GitHub repo `sumairniz/SJN-MDCAT-LMS`, working staging branch `sjn-phase1a-foundation`. Production branch untouched. Latest code checkpoint as verified at writing: commit `991551a01a8a4621d16fb4cc55dfd2aaab2f2c33`, two GitHub Actions runs SUCCESS on this SHA (subsequent doc commits do not alter tested source).
- Staging Supabase project: `aozknkrwafowsrehdwlr`, region Mumbai `ap-south-1`. Do not use production Supabase project `yapvnevvjfewvafbjcgc`.
- Vercel `sjn-mdcat-lms`, team `sjn1` (ID `team_AOaL10r6OwIXpIy4XlO8DmSH`); ChatGPT Vercel team access already approved and verified. Preview branch `sjn-phase1a-foundation`.
- Vercel Preview **branch-specific** env names verified: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`. **Missing**: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. Existing R2 account/bucket values are configured for Preview only.
- Cloudflare connected account ID `e9fc71a915e2f2bce29531366f580aa8`; R2 bucket `sjn-mednest-academy-resources`, Standard APAC, public r2.dev disabled, no public custom domains. Cloudflare OAuth granted R2 Storage Read + Write but **not API Tokens Write**. Cloudflare connector cannot issue a permanent S3 Access Key ID/Secret from current OAuth scopes. Do not request Full Access; not needed.

## 3. Exact published folder structure and staged PDF records
Folder names in Supabase `public.academy_resource_folders`, both **is_published = true**:
1. `MDCAT Syllabus by SJN` — folder id `d3ad348a-7c52-4281-a4ac-742e941e0f3f`.
2. `Biology Resources` — folder id `6e43b431-8f87-4351-86fe-b98554dcd0fb`.

All THREE files really exist in private R2; direct Cloudflare object listing confirmed exact paths, MIME `application/pdf` and size. Corresponding entries in `public.academy_resource_files` have matching keys and **is_published = false** until server credentials + live verification:

| Folder | Object key in R2 (NO `pdfs/` parent!) | Bytes |
| --- | --- | ---: |
| MDCAT Syllabus by SJN | `mdcat-syllabus/physics-syllabus-2026-sjn.pdf` | 7104 |
| Biology Resources | `biology-resources/biotechnology-notes-stb-ftb-kpk-ptb-sjn.pdf` | 42881 |
| Biology Resources | `biology-resources/biology-one-pagers-stb-sjn.pdf` | 11836553 |

Original PDFs were supplied by owner; uploaded manually to Cloudflare dashboard with exactly these paths. Earlier ZIP recommendation had an extra `pdfs/` folder, but owner instead created root `biology-resources/` and `mdcat-syllabus/`. **This was fixed** both in Supabase keys and backend key validation; DO NOT tell user to reupload, rename, or add `pdfs/`. Do not upload duplicates.

## 4. Implemented code / migration / current known QA
- `database/migrations/20261103_academy_resources_private_pdf_folders.sql` applied to **staging**; separate folder/file tables, published-only authenticated SELECT RLS; no public writes. Legacy `resources` table untouched.
- `server.js`: `/api/content` **no longer reads legacy resources alongside MCQs**. Mounts `registerAcademyResourceRoutes(app, auth)` separately. No PDF bytes travel through exam content endpoint.
- `lib/academy-resources.js`: authenticated `GET /api/academy-resources` lazy catalog and `GET /api/academy-resources/:id/open`, checks published file + folder, safe PDF key and generates 180-second S3 SigV4 private GET URL using Vercel server-only credentials. Fails closed with HTTP 503 when credentials missing. No public bucket. Key validation allows safe paths without `pdfs/` parent.
- `public/index.html`, `public/sjn-academy-resources.js`, `public/sjn-academy-resources.css`: larger title, on-demand library init only upon module entry, folder navigation, iframe PDF reader, expanded mode and mobile CSS; resource state cleared on logout. Never preload PDFs during quiz.
- `tests/academy-resources.test.js` guards isolation/security/UI. GitHub Actions passed for code SHA `991551a01`. **This is not proof of authenticated live PDF GET, rendering, mobile browser test, or owner UAT.**
- Potential next engineering QA: Validate server-generated SigV4 URL against R2, expiration, PDF iframe loading and byte-range behavior (larger 11.8 MB Biology PDF), mobile navigation & expanded/restore, close/logout, authorization isolation, initial load and quiz regressions. If any unexpected issue, fix dev only and rerun CI. Do not claim mobile/browser E2E performed until actually tested.

## 5. Current only blocking actions: Cloudflare R2 S3 credentials + Vercel Preview secrets
**User must perform two short secure UI operations; assistant handles the rest afterward.** The current Cloudflare connector has R2 Storage Write, NOT token-management scope; giving broad/full Cloudflare access to ChatGPT is not required and does not fix local-file transfer restrictions. Because the API credential secret is sensitive, the user should type it into Vercel directly rather than sending in chat.

**Action A — Cloudflare**
1. Cloudflare Dashboard → R2 Object Storage → R2 Overview → under Account Details find **API Tokens** and click **Manage**.
2. **Create Account API token** (prefer purpose-limited long-lived account token; alternatively User API token if needed).
3. Name `SJN MedNest LMS - Staging PDF Reader`.
4. Permissions **Object Read**, restrict to **only** bucket `sjn-mednest-academy-resources`; do not grant Object Write/Admin/DNS/other access. Choose an expiration policy that suits staging use (avoid abrupt expiry for testing; rotate later).
5. Create. Copy **Access Key ID** and **Secret Access Key** securely (secret shown at creation). **Do not paste secrets into ChatGPT, GitHub, screenshot, or frontend.**

Official docs: https://developers.cloudflare.com/r2/api/tokens/

**Action B — Vercel**
1. Vercel Dashboard → team **sjn1** → project `sjn-mdcat-lms` → Settings → Environment Variables.
2. Add `R2_ACCESS_KEY_ID` = Cloudflare Access Key ID; `R2_SECRET_ACCESS_KEY` = Cloudflare Secret Access Key.
3. Target **Preview only**, restrict each to Git branch `sjn-phase1a-foundation`; use secure/sensitive or encrypted storage. NOT Production, no `NEXT_PUBLIC_` or client-side prefix. `R2_ACCOUNT_ID` and `R2_BUCKET_NAME` already exist; do not duplicate.
4. Save changes. **Redeploy the staging preview** so new variables are active. Do not deploy/change production.
5. User confirms **“Credentials configured”**, or shares a screenshot **with secret values hidden** if stuck.

## 6. Assistant's next actions after credential confirmation
1. Read (not decrypt) Vercel preview environment variable **names, targets, branch**; verify both new keys set in Preview. If needed, request/trigger a staging redeployment (not production).
2. Validate secure authenticated `GET /api/academy-resources` behavior and a legitimate published PDF open. Current files unpublished; for a controlled end-to-end test publish **one** resource first, verify authorized viewer, then publish other two. Never expose bucket publicly to bypass auth; do not disclose signed URLs.
3. Check R2 keys/size match table; test 2-page Physics, 5-page Biotech, 18-page image-heavy Biology PDF, normal & expanded desktop/mobile, security, cross-user session, logout cleanup, unrelated Create Test/History/Courses.
4. Record actual test results and limitations in this file and Master Plan. Ask owner to perform signed-in desktop/mobile UAT before declaring accepted.
5. Admin Panel (folder creation/upload/delete/visibility) is FUTURE work. No video hosting, no auto loading unrelated resources.

## 7. How to continue in another chat
Ask: **“Continue SJN MedNest LMS Academy Resources staging. Read `docs/ACADEMY-RESOURCES-HANDOVER-2026-11-03.md` on branch `sjn-phase1a-foundation`, then check Vercel preview credentials and resume live PDF viewer verification. Do not change production or the exam system.”**

The current conversation may be closed; this handover is the cross-chat checkpoint. Never depend on conversation memory alone.
