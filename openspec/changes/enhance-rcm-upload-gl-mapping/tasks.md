## 1. Frontend TLC RCM Parser Update

- [x] 1.1 Update `TLCSchema` in `rcm-parser.ts` to include an optional `No_GL` or `noGL` field.
- [x] 1.2 Modify the mapping return block for TLC in `rcm-parser.ts` to read the GL code column and assign it to the `accountCode` field of the returned staging row.

## 2. Backend RCM Finalize API Update

- [x] 2.1 Modify the `/api/migration/finalize` endpoint in `worker/routes/migration.ts` to extract `accountCode` and `affectedFsliItem` from the incoming `rcmData` rows.
- [x] 2.2 Update the `bpmProcesses` insert query inside `/api/migration/finalize` to write `noGL` (from `accountCode`) and `fsliName` (from `affectedFsliItem`).
- [x] 2.3 Fix `/rcm-matrix/tlc` API GL filtering for backlog when `bpmProcessId` is provided.

## 3. RCM CSV Demo Data Templates Update

- [x] 3.1 Update the generated RCM TLC demo file `demo/Laporan_Keuangan_Bank_ICOFR_2026_Demo_BTN_RCM_TLC.csv` to include the `No_GL` column and populate it with the appropriate Bank BTN GL codes.

## 4. Verification & Testing

- [x] 4.1 Run type check (`npm run type-check`) and linter (`npm run lint`) to ensure no regressions are introduced.
- [x] 4.2 Verify in the local browser that the imported RCM processes now appear automatically on the BPM page when selecting FSLI and GL filters.
