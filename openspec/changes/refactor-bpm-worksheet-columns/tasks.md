## 1. Schema & Types Refactoring

- [x] 1.1 Update `shared/types.ts` to rename `businessProcessLvl1` to `businessProcess` and remove `businessProcessLvl2`.
- [x] 1.2 Update `worker/db/schema.ts` to rename the `businessProcessLvl1` column to `businessProcess` in the `controls` table.
- [x] 1.3 Generate and apply Drizzle migration: `npx drizzle-kit generate` and `npx drizzle-kit push`.

## 2. Backend API Updates

- [x] 2.1 Update `worker/user-routes.ts` POST `/api/controls` to use `businessProcess` field.
- [x] 2.2 Update `worker/user-routes.ts` PUT `/api/controls/:id/bpm-update` to use `businessProcess` field.
- [x] 2.3 Verify any other occurrences of `business_process_lvl1` in the backend are updated.

## 3. Frontend Localization

- [x] 3.1 Update `src/i18n/locales/en/bpm.json` with new column keys under `worksheet.columns`.
- [x] 3.2 Update `src/i18n/locales/id/bpm.json` with new column keys under `worksheet.columns`.

## 4. Frontend UI Refactoring

- [x] 4.1 Update `src/components/bpm/BPMWorksheet.tsx` column definitions:
    - Rename "Lvl 1" to "Informasi Proses Bisnis" using i18n key.
    - Remove "Lvl 2" column.
    - Move "Nama Aktivitas Pengendalian" between "Sub-Proses" and "Lokasi".
- [x] 4.2 Update `debouncedUpdate` and `createMutation` calls in `BPMWorksheet.tsx` to use the new field name `businessProcess`.
- [x] 4.3 Clean up any unused imports or variables related to the old field names.

## 5. Verification

- [x] 5.1 Verify that adding a new row in the worksheet correctly populates "Informasi Proses Bisnis".
- [x] 5.2 Verify that editing the columns correctly triggers the debounced API update.
- [x] 5.3 Verify that the column order matches the request: Workflow -> Process -> Sub-Process -> Control Name -> Location.
- [x] 5.4 Check that "Lvl 2" information is no longer appearing anywhere in the UI.
