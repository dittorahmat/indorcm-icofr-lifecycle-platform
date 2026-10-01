## 1. Localization & Routing Setup

- [x] 1.1 Add `"app10": "Lampiran 10 (Kertas Kerja DoD)"` to `src/i18n/locales/id/sidebar.json` and `"app10": "Appendix 10 (DoD Worksheet)"` to `src/i18n/locales/en/sidebar.json`
- [x] 1.2 Create `src/pages/reports/Appendix10Page.tsx` container rendering `DoDLampiran10Report` with AppLayout and page header
- [x] 1.3 Register `/reports/appendix-10` in `src/main.tsx` coreRoutes lazy-loaded with PageSuspense

## 2. Sidebar Navigation Integration

- [x] 2.1 Add Appendix 10 sidebar item using `FileSpreadsheet` icon in `src/components/app-sidebar.tsx` strictly between `items.wbs` and `items.app11`
- [x] 2.2 Verify active state highlighting when navigating to `/reports/appendix-10` and fiscal year preservation

## 3. Verification & Compliance Validation

- [x] 3.1 Write unit tests in `src/components/reports/__tests__/Appendix10Page.test.tsx` verifying route rendering, 24 columns, and localization
- [x] 3.2 Run `npx tsc --noEmit -p tsconfig.app.json` and tests to verify no regressions
