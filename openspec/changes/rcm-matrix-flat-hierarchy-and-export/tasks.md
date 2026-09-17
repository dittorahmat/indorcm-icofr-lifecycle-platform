## 1. Backend Hierarchy Resolving & Matrix Query

- [x] 1.1 Update `worker/routes/rcm.ts` to join `bpm_processes` hierarchy (parent process vs sub process) on `GET /api/rcm-matrix/tlc`, populating `parentProcessName`, `parentBpmCode`, and `subProcessName`. Verify with manual curl or automated test.
- [x] 1.2 Update shared interfaces if necessary in `src/pages/rcm/RCMTLCPage.tsx` and `src/pages/rcm/RCMITGCPage.tsx` to accept the hierarchy-resolved fields.

## 2. Frontend Flat Matrix & Column Refactoring

- [x] 2.1 Remove `renderGroupRow` in `src/pages/rcm/RCMTLCPage.tsx` and refactor `process_info` column to purely render Parent Process name & code, and `sub_process` to render Sub-Process name. Verify flat table rendering without blue bars.
- [x] 2.2 Remove `renderGroupRow` in `src/pages/rcm/RCMITGCPage.tsx` to render ITGC matrix in flat view without blue header bars.
- [x] 2.3 Verify `RCMEditDialog.tsx` remains compatible with the flat row items.

## 3. Excel Export Utility & Integration

- [x] 3.1 Implement `src/lib/rcm-excel-export.ts` with comprehensive column mapping for TLC, ELC, and ITGC matrix data using `xlsx`.
- [x] 3.2 Add `onExport` / Export Excel button to `src/components/rcm/RCMPageHeader.tsx`.
- [x] 3.3 Connect Export Excel action in `src/pages/rcm/RCMTLCPage.tsx`, `src/pages/rcm/RCMELCPage.tsx`, and `src/pages/rcm/RCMITGCPage.tsx`. Verify file download triggered with valid `.xlsx`.
- [x] 3.4 Add localization strings for Export Excel in `src/i18n/locales/id/rcm.json` and `src/i18n/locales/en/rcm.json`.

## 4. Verification & Mandat Penyelesaian Tahap

- [x] 4.1 Create unit test in `src/test/rcm-matrix-flat-export.test.ts` verifying export utility and data formatting.
- [x] 4.2 Run `npm run type-check` and ensure 0 TypeScript errors.
- [x] 4.3 Run `npm run lint` and ensure 0 lint errors.
- [x] 4.4 Run `npm test` and ensure all test suites pass.
- [x] 4.5 Run `npm run build` and ensure successful production build.
