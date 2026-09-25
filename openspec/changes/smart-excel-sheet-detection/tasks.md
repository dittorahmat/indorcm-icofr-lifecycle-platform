## 1. Sheet Inspection and Parsing Utilities

- [x] 1.1 Implement workbook sheet visibility and header inspection helpers in `compliance-utils.ts` and verify unit test passes.
- [x] 1.2 Update `gl-parser.ts` to support multi-sheet inspection, hidden sheet filtering, auto-selection of single valid visible sheet, and `requiresSheetSelection` return mode.
- [x] 1.3 Update `rcm-parser.ts` to support multi-sheet inspection and hidden sheet filtering for ELC, TLC, and ITGC.

## 2. Interactive Sheet Selection UI

- [x] 2.1 Create `SheetSelectionModal.tsx` in `src/components/import/` adhering strictly to design-taste-frontend anti-AI slop standards (minimum 12px font, enterprise rounded corners, high contrast badges).
- [x] 2.2 Integrate `SheetSelectionModal` into `SmartImportWizard.tsx` to handle `requiresSheetSelection` fallback when uploading GL or RCM files.
- [x] 2.3 Verify uploading `Laporan Keuangan Perusahaan Manufaktur.xlsx` automatically selects `Sheet3` without error.

## 3. Verification & Compliance Suite

- [x] 3.1 Run `npm run type-check` to verify TypeScript integrity across modified components and services.
- [x] 3.2 Run `npm run lint` and `npm test` to ensure zero regressions in existing parser and scoping tests.
- [x] 3.3 Run `npm run build` to confirm production build succeeds.
