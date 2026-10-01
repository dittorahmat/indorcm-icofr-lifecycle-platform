## 1. Localization & Types

- [x] 1.1 Add bilingual localization keys (ID & EN) for all 24 columns of Lampiran 10, table headers, filter options, and empty states in `src/i18n/locales/{id,en}/reports.json` and verify with type-check
- [x] 1.2 Verify that `shared/types.ts` has all necessary fields for DoD reporting or add helper extraction types and verify with `npx tsc --noEmit`

## 2. Component Implementation

- [x] 2.1 Create `src/components/reports/DoDLampiran10Report.tsx` with 24-column table layout, sticky header, responsive wrapper, and anti-AI slop typography (>=12px font, enterprise styling)
- [x] 2.2 Implement interactive filters (Severity CD/SD/MW, remediation status, business process) and summary counters in `DoDLampiran10Report.tsx`
- [x] 2.3 Implement client-side CSV export functionality and print layout with digital sign-off blocks (Auditor Lini 3 & Komite Audit)
- [x] 2.4 Replace placeholder `DoDReport` in `src/components/reports/RegulatoryReportComponents.tsx` with `DoDLampiran10Report` and wire data props from `RegulatoryAppendices.tsx`

## 3. Testing & Verification

- [x] 3.1 Create comprehensive unit tests in `src/components/reports/__tests__/DoDLampiran10Report.test.tsx` verifying 24-column rendering, filter toggling, CSV download trigger, and empty states
- [x] 3.2 Run test suite `npm test -- src/components/reports/__tests__/DoDLampiran10Report.test.tsx` and verify all tests pass
- [x] 3.3 Run verification suite (`npm run type-check`, `npm run lint`, `npm run build`) and confirm clean build without errors
