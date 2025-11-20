## Solution Summary

This repository contains a small Express backend and a React frontend. I focused on the areas requested in the README and your follow-ups: replace blocking I/O, add pagination & search, fix a frontend memory leak, add virtualization for large lists, improve UI/UX, and make error handling and cache behavior more robust.

**What I changed**

- Backend
  - Converted blocking file I/O in `backend/src/routes/items.js` to async `fs.promises` and converted handlers to `async/await`.
  - Implemented server-side pagination and search in `GET /api/items` (supports `q`, `page`, `limit`) and returns a paginated shape: `{ items, page, limit, total, totalPages }`.
  - Fixed `POST /api/items` to use async write and minimal validation (requires `name`); after writing it proactively refreshes the cached stats (best-effort).
  - Implemented an in-memory cache for `/api/stats` in `backend/src/routes/stats.js`, primed it at startup, refreshed it on file changes (`fs.watchFile`) and exposed `router.refreshCache()` so writers can refresh the cache immediately after mutation.
  - Added a JSON error handler middleware and a `favicon.ico -> 204` route to avoid noisy logs.
  - Made `src/index.js` export the `app` so tests can `require()` it without starting the server.
  - Added Jest + Supertest tests skeleton in `backend/tests/items.test.js` that back up/restore `data/items.json` when mutating it.

- Frontend
  - Fixed a memory leak in `Items.js` by supporting `AbortController` (introduced in `DataContext.fetchItems`) and canceling fetches on unmount.
  - Switched DataContext fetch to use a relative `/api/items` URL and expose pagination metadata via a `pageInfo` object.
  - Implemented search UI with server-side `q` param and pagination UI (Prev/Next) in `frontend/src/pages/Items.js`.
  - Integrated `react-window` to virtualize the rendered list for performance.
  - Improved loading UX: skeleton rows, aria-live/role announcements, accessible search label, and improved styling in `Items` and `ItemDetail` pages.
  - Added a small frontend proxy (`"proxy": "http://localhost:3001"`) to `frontend/package.json` for the CRA dev server.

**Error handling & edge cases**

- Backend
  - All routes use try/catch and forward errors to the centralized error handler which returns JSON: `{ error: message }` (status code from `err.status` or 500).
  - POST validates basic required fields and returns 400 on invalid input.
  - Writes are performed with `fs.promises.writeFile`; after a write the stats cache is refreshed best-effort and failures are logged but do not block the successful write response.
  - The stats cache has two refresh mechanisms: a file watcher and an explicit `refreshCache()` invocation from writers — this reduces race windows and ensures `/api/stats` reflects recent writes.
  - The app no longer crashes on favicon or unknown routes; not-found errors now return structured JSON.

- Frontend
  - `fetchItems` accepts an `AbortSignal` so in-flight requests are canceled on unmount or when a new search/page starts.
  - UI shows a loading skeleton and friendly messages for empty results and errors.
  - The search input is accessible and resets page to 1 when changed.

**Trade-offs & rationale**

- Files vs DB: I kept the simple file-backed data store to match the project. For real production scale or concurrent writes, a small embedded DB (SQLite) or a proper data-store would be preferred. Files are simpler and kept the scope small.

- Caching strategy: I use an in-memory cache for `/api/stats` that is refreshed on file change and proactively after writes. This is simple and effective for the assignment; it won't survive restarts and is per-process (not cluster-safe). For multi-process deployments, move caching to an external store (Redis) or compute stats on write and persist them.

- Validation: I added minimal validation to prevent obviously bad writes. For better safety use a schema validator (Joi/Zod) and centralize validation middleware.

- Pagination + virtualization: The UI virtualizes the current page of items using `react-window`. Virtualizing the entire dataset would require requesting larger pages or implementing infinite-load-on-scroll; I chose a paged + virtualized approach to limit memory while keeping UX responsive.

- Tests: I added initial Jest + Supertest tests covering happy paths and basic error cases. Tests operate on the real `data/items.json` but back up/restore it; for a more robust test suite use fixtures or an in-memory data file for isolation.

**How to run**

1. Backend

```powershell
cd backend
npm install
npm start
```

- API endpoints:
  - `GET /api/items?q=search&page=1&limit=20`
  - `GET /api/items/:id`
  - `POST /api/items` (JSON body, requires `name`)
  - `GET /api/stats`

2. Frontend (dev)

```powershell
cd frontend
npm install
npm start
# open http://localhost:3000
```

**Files to review**

- Backend: `backend/src/routes/items.js`, `backend/src/routes/stats.js`, `backend/src/index.js`, `backend/src/middleware/errorHandler.js`
- Frontend: `frontend/src/pages/Items.js`, `frontend/src/pages/ItemDetail.js`, `frontend/src/state/DataContext.js`
- Tests: `backend/tests/items.test.js`

**Next improvements (optional)**

- Add full request schema validation (Joi/Zod) and richer error codes.
- Switch file IO to atomic writes (write+rename) to reduce corruption risk under concurrent writes.
- Add debounce to frontend search input and optional retry/backoff for fetch requests.
- Replace the file-based store with SQLite or a lightweight JSON DB for concurrent-safe writes and more realistic testing.
- Expand tests to include pagination boundaries, search edge-cases, and cache behavior under concurrent writes.

If you'd like, I can implement any of the suggested next improvements — tell me which one to prioritize and I will proceed.
