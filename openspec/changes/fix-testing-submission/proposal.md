## Why

The Testing Workbench currently fails to submit TOD/TOE results because of several misalignments between the frontend, backend, and database schema:
1. The frontend calls a non-existent plural endpoint `/api/users/me` instead of `/api/user/me`.
2. The `POST /api/tests` endpoint is missing in the backend.
3. The `test_records` database table is missing columns (`comments`, `sampleSize`, `homogeneityJustification`) required by the Regulation SK-5 compliant test form.

## What Changes

- **Frontend**: Update `src/pages/testing/TestWorkbench.tsx` to use the correct user profile endpoint `/api/user/me`.
- **Localization**: Implement full i18n support for the Testing Workbench by moving hardcoded strings to `testing.json` (EN/ID).
- **Backend**: Implement `POST /api/tests` in `worker/user-routes.ts` to handle submission of test results.
- **Database**: Add missing columns to the `test_records` table, update the Drizzle schema in `worker/db/schema.ts`, and execute migrations.
- **Types**: Ensure `shared/types.ts` and database schemas are fully synchronized regarding test record attributes.

## Capabilities

### New Capabilities
- `test-submission`: Implementation of the full lifecycle for submitting and persisting TOD/TOE test records, including compliance-mandated attributes like homogeneity justification and sample size.

### Modified Capabilities
- None (This fixes an incomplete implementation of the existing testing workbench).

## Impact

- `src/pages/testing/TestWorkbench.tsx`: Endpoint fix.
- `worker/user-routes.ts`: New route handler.
- `worker/db/schema.ts`: Schema update for `test_records`.
- `shared/types.ts`: Type definition alignment.
- Database: New migration for `test_records` columns.
