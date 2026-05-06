## 1. Backend Data & Schema

- [x] 1.1 Add `scheduleId` to `csaRecords` table in `worker/db/schema.ts`.
- [x] 1.2 Add `is_draft` flag and biometric bypass logic to `POST /api/csa` in `worker/user-routes.ts`.
- [x] 1.3 Implement schedule status propagation (Started/Completed) in `worker/user-routes.ts`.
- [x] 1.4 Generate and run database migration using `npx drizzle-kit push`.

## 2. Frontend Lifecycle & State

- [x] 2.1 Update `TodoListPage.tsx` to pass `scheduleId` to `BPMModal` on "Execute".
- [x] 2.2 Update `BPMModal.tsx` to receive `scheduleId` and set default tab to "CSA Assessment".
- [x] 2.3 Implement "Save as Draft" button in `CSATabContent.tsx` with non-blocking logic.
- [x] 2.4 Add visual progress indicator and success feedback for draft saves in `CSATabContent.tsx`.

## 3. Visuals & Notifications

- [x] 3.1 Update `TodoListPage.tsx` calendar grid with urgency-based color mapping (Yellow/Red/Pulsing).
- [x] 3.2 Refactor `Header.tsx` to surface task-related alerts in the notification bell.
- [x] 3.3 Ensure sidebar reflects new notification counts and task status.

## 4. Safety & Localization

- [x] 4.1 Apply `UnsavedChangesDialog` and stabilized `useUnsavedChanges` hook to all data-entry pages.
- [x] 4.2 Update `@src/i18n/` (ID/EN) with new status strings and action labels.
- [x] 4.3 Verify build with `npm run build` and ensure no vendor chunk regressions.

## 5. Verification

- [x] 5.1 Confirm that clicking "Execute" on a task opens the correct Hub tab with `scheduleId`.
- [x] 5.2 Verify that "Save as Draft" updates calendar status to "In Progress" (Yellow).
- [x] 5.3 Verify that final "Sign-off" updates calendar status to "Completed" (Green).
- [x] 5.4 Confirm that overdue tasks correctly appear in Red/Pulsing Red.
