## 1. Preparation

- [x] 1.1 Create the `worker/routes/` directory.
- [x] 1.2 Ensure `HonoEnv` and other shared types are correctly exported from `worker/app.ts` or `worker/types.d.ts`.

## 2. Notification Sub-App Extraction

- [x] 2.1 Create `worker/routes/notifications.ts` with Hono instance initialization.
- [x] 2.2 Identify and move all notification route handlers from `worker/user-routes.ts`.
- [x] 2.3 Strip the `/api/notifications` prefix from the paths in `worker/routes/notifications.ts`.
- [x] 2.4 Update all imports in the new file (fix relative paths for `db`, `schema`, `utils`).

## 3. License Sub-App Extraction

- [x] 3.1 Create `worker/routes/license.ts` with Hono instance initialization.
- [x] 3.2 Identify and move all license route handlers from `worker/user-routes.ts`.
- [x] 3.3 Strip the `/api/license` prefix from the paths in `worker/routes/license.ts`.
- [x] 3.4 Update all imports in the new file (fix relative paths, ensure `crypto` and `GoogleGenerativeAI` are available).

## 4. Orchestration & Cleanup

- [x] 4.1 Import the new sub-apps in `worker/app.ts`.
- [x] 4.2 Mount the sub-apps using `app.route()` after global middleware but before `userRoutes(app)`.
- [x] 4.3 Chain the `.route()` calls to ensure `AppType` captures all routes.
- [x] 4.4 Remove the extracted routes and unused imports from `worker/user-routes.ts`.

## 5. Verification

- [x] 5.1 Run TypeScript compiler to verify no type regressions (`tsc`).
- [x] 5.2 Run a production build test to ensure compatibility.
- [x] 5.3 Manually verify Notification endpoints return correct data.
- [x] 5.4 Manually verify License endpoints return correct data.
