## 1. Backend Schema & Migration

- [x] 1.1 Add `bpmProcessId` to `transactionDetails` table in `worker/db/schema.ts`.
- [x] 1.2 Add an index for `bpmProcessId` in the `transactionDetails` table.
- [x] 1.3 Add a unique index for `bpmCode` in `bpm_processes` table.
- [x] 1.4 Run `npx drizzle-kit push` to apply schema changes to the database.
- [x] 1.5 Update `GET /api/transaction-details` in `worker/user-routes.ts` to support filtering by `bpmProcessId`.
- [x] 1.6 Update transaction upload logic in `worker/user-routes.ts` to resolve `bpmCode` per row.

## 2. Master Data UI (BPM Code)

- [x] 2.1 Add "BPM Code" input field (text) to the standard procedure section in `BPMWorksheet.tsx`.
- [x] 2.2 Implement uniqueness check and error handling for the BPM Code in `PATCH /api/bpm-processes/:id`.
- [x] 2.3 Update `BPMModal.tsx` and `BPMPage.tsx` overview table to display the human-readable BPM Code.

## 3. Transaction Sampling & CSA

- [x] 3.1 Update `TransactionSamplingTab.tsx` to pass the current `bpmProcessId` to the API.
- [x] 3.2 Ensure transactions displayed in the sampling tab are isolated to the current sub-process.
- [x] 3.3 Update `CSATabContent.tsx` to ensure verification logic only considers process-linked transactions.

## 4. Safety, Localization & Data

- [x] 4.1 Update `@src/i18n/` locales (ID/EN) with labels for "BPM Code" and process-aware transaction alerts.
- [x] 4.2 Ensure `UnsavedChangesDialog` correctly tracks the new BPM Code field in the worksheet.
- [x] 4.3 Generate `Sample_Transactions_200.csv` with `bpmCode` column for testing.
- [x] 4.4 Run full validation suite: `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
- [x] 4.5 Fix any regressions or type mismatches identified during validation.
