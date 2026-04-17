## 1. Backend Fixes & Imports

- [x] 1.1 Add missing imports (`testRecords`, `organization`, `testRecords`) to `worker/user-routes.ts`.
- [x] 1.2 Implement the `/api/settings` GET route to retrieve organization metadata.
- [x] 1.3 Fix the `/api/reports/summary` route to return correct counts from `deficiencies` and include `deficienciesByStatus`.
- [x] 1.4 Implement the missing `/api/aggregatedeficiencies` POST and GET routes.

## 2. Reporting Module Implementation

- [x] 2.1 Implement the `/api/reports/sign-off` POST route to update period lock and signatures.
- [x] 2.2 Implement the `/api/reports/export` POST route for generating multi-format reports.
- [x] 2.3 Implement the RCM validation (`/api/rcm/:id/validate`) and approval (`/api/rcm/:id/approve-change`) routes.
- [x] 2.4 Fix the 500 error in `/api/tests` by ensuring `testRecords` table usage is correct.

## 3. Frontend Reliability & defensive coding

- [x] 3.1 Update `ReportsPage.tsx` with optional chaining and nullish coalescing to prevent crashes during data loading.
- [x] 3.2 Add skeleton loaders or empty states for charts that might not have data.
- [x] 3.3 Ensure export handlers in `ReportsPage.tsx` properly handle the new backend response structure.

## 4. Verification & Testing

- [x] 4.1 Verify `ReportsPage` loads without errors for all dashboard and management tabs.
- [x] 4.2 Test the CEO/CFO sign-off process and ensure the period is correctly locked.
- [x] 4.3 Verify both CSV and Excel exports contain valid and complete data.
- [x] 4.4 Confirm `api/tests` and `api/deficiencies` work as intended after refactoring.
