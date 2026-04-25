## 1. Schema & Backend Update

- [x] 1.1 Add `riskCount` and `controlCount` columns to `bpm_processes` table in `worker/db/schema.ts`
- [x] 1.2 Update `BPMProcess` interface in `shared/types.ts`
- [x] 1.3 Generate and run Drizzle migration using `npx drizzle-kit generate` and `npx drizzle-kit push`
- [x] 1.4 Update `PUT /api/bpm-diagrams/:id` in `worker/user-routes.ts` to recalculate and update counts in `bpm_processes`
- [x] 1.5 Update `GET /api/bpm-processes` in `worker/user-routes.ts` to return count columns from the database instead of calculating on the fly

## 2. Localization & UI Preparation

- [x] 2.1 Add `fsliLabel` key to `src/i18n/locales/id/bpm.json` ("FSLI")
- [x] 2.2 Add `fsliLabel` key to `src/i18n/locales/en/bpm.json` ("FSLI")
- [x] 2.3 Update `src/pages/bpm/BPMPage.tsx` to use `t('bpm:fsliLabel')` instead of `t('scoping:activeSource')`

## 3. Unsaved Changes Guard

- [x] 3.1 Verify `useUnsavedChanges` hook usage in `src/pages/bpm/BPMPage.tsx` for `isAssertionDirty` state
- [x] 3.2 Ensure `UnsavedChangesDialog` is properly rendered in `BPMPage.tsx`

## 4. Verification

- [x] 4.1 Verify FSLI label change in both Indonesian and English
- [x] 4.2 Create a new diagram or update an existing one to trigger count synchronization
- [x] 4.3 Verify that the Sub Process table shows accurate counts after saving a diagram
- [x] 4.4 Verify that navigating away with unsaved assertions triggers the warning dialog
