# Public Deployment Checklist

This is no longer a static-only HTML page. For the real database, accounts and AI Tutor, deploy the whole Node project.

1. Use a Node.js hosting provider with a persistent filesystem for SQLite, or change the database layer to PostgreSQL for multi-instance scaling.
2. Upload the complete project.
3. Set environment variables from `.env.example`.
4. Run `npm install`.
5. Run `npm run sync-content`.
6. Run `npm start`.
7. Point the domain to the server and enable HTTPS.
8. Never put `GEMINI_API_KEY`, `JWT_SECRET`, or `ADMIN_TOKEN` into `public/index.html`.

For larger academies, migrate SQLite to PostgreSQL and object storage for PDFs before running multiple server instances.
