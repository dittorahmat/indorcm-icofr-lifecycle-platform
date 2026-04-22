## 1. Database & Schema Updates

- [x] 1.1 Update `worker/db/schema.ts` to include `comments`, `sample_size`, and `homogeneity_justification` in `test_records` table.
- [x] 1.2 Generate new database migration using `npx drizzle-kit generate`.
- [x] 1.3 Apply migrations to the PostgreSQL database using `npx drizzle-kit push` (or manual SQL if preferred).
- [x] 1.4 Update `shared/types.ts` to ensure `TestRecord` and related types include `homogeneityJustification` and match the database schema.

## 2. Localization Implementation

- [x] 2.1 Create `src/i18n/locales/en/testing.json` and `src/i18n/locales/id/testing.json` with all strings from `TestWorkbench.tsx`.
- [x] 2.2 Register the `testing` namespace in `src/i18n/config.ts`.
- [x] 2.3 Refactor `src/pages/testing/TestWorkbench.tsx` to use the `useTranslation` hook and externalized strings.

## 3. Backend Implementation

- [x] 3.1 Implement `app.post('/api/tests')` route in `worker/user-routes.ts`.
- [x] 3.2 Ensure the new route correctly extracts `organizationId` from context and `userId` from session.
- [x] 3.3 Verify `POST /api/tests` correctly persists all form fields including evaluation attributes.

## 4. Frontend Fixes

- [x] 4.1 Update `src/pages/testing/TestWorkbench.tsx` to change `/api/users/me` to `/api/user/me`.
- [x] 4.2 Verify that `userData` is correctly populated and the "Cooling-Off" validation logic works as intended.
- [x] 4.3 Test the full submission flow for both TOD and TOE to ensure successful persistence and toast notifications.
