# SJN MDCAT LMS Pro v2

A production-oriented LMS starter based on the existing SJN portal design.

## What is fixed

- Courses, Past Papers and Study Resources use a two-pane layout: list on the left, selected content viewer on the right.
- Only one question bank exists: **Past Papers Question Bank**. It starts empty.
- MCQs are code/content-file driven; there is no public one-by-one content manager.
- Bulk MCQ import supports hundreds or thousands of MCQs at once.
- Students can mix subjects, chapters and topics in a single practice test and enter any MCQ count up to the available pool.
- Accounts use a server-side database.
- Attempts and bookmarks can be persisted server-side.
- AI Tutor uses a server-side Gemini endpoint; the API key is never placed in the browser.
- PDFs can be placed in `content/resources/` and exposed as Study Resources.

## Setup

1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and set `JWT_SECRET`, `ADMIN_TOKEN`, and optionally `GEMINI_API_KEY`.
3. Run `npm install`.
4. Run `npm run sync-content`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

## Adding content

Edit `content/seed.json` for courses, past papers and resources.

For large MCQ batches, create `content/mcqs.json` using the example schema in `content/mcqs.example.json`, then run:

`npm run sync-mcqs`

All imported MCQs are assigned to **Past Papers Question Bank** automatically. No other question bank is created.

For PDFs, put the PDF in `content/resources/`, add a resource entry in `content/seed.json`, then run `npm run sync-content`.

## Production deployment

Use a persistent Node host (VPS, Render, Railway, Fly.io, etc.) rather than a static-only host because the LMS has authentication, database and server-side AI. Keep `.env` private and use HTTPS.
