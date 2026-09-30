## 1. Global Navigation Shell & Header Ergonomics

- [x] 1.1 Integrate a global `SidebarTrigger` into `MainHeader.tsx` visible on mobile screens (`md:hidden`) and verify the hamburger button opens the navigation drawer.
- [x] 1.2 Optimize `MainHeader.tsx` layout for small viewports by condensing `FiscalYearSelector` and nesting profile actions without horizontal overflow.
- [x] 1.3 Create `src/components/layout/MobileBottomNav.tsx` with thumb-zone shortcuts (Dashboard, CSA Tasks, RCM, and Menu Drawer) and verify active route indicators.
- [x] 1.4 Integrate `MobileBottomNav` into `RootLayout.tsx` and adjust `AIFabButton` bottom clearance to prevent overlapping touch targets.

## 2. Glanceable & Action-Oriented Mobile Dashboard

- [x] 2.1 Refactor `DashboardKPIs.tsx` to render a 2x2 grid on mobile viewports (`grid-cols-2 md:grid-cols-4`) and verify typography strictly follows the minimum 12px rule.
- [x] 2.2 Reorganize `Dashboard.tsx` layout to elevate `ActionCenter` above analytical charts when viewed on mobile screens.
- [x] 2.3 Implement tabbed/collapsible views for `ComplianceCharts` and `COSOCoverageGrid` on mobile viewports to prevent excessive vertical scrolling.
- [x] 2.4 Verify the entire mobile dashboard renders cleanly without horizontal page scroll at 375px viewport width.

## 3. On-The-Go Field CSA Workbench

- [x] 3.1 Implement responsive card-stack view (`CSAMobileCard`) in `src/pages/csa/CSAPage.tsx` for mobile viewports while preserving desktop table view.
- [x] 3.2 Adapt `src/components/csa/TODVerificationDialog.tsx` to render a mobile-friendly bottom-sheet drawer with sticky footer action buttons (`Batal` / `Simpan Penilaian`).
- [x] 3.3 Verify file and camera capture triggers function properly for evidence uploads within the CSA modal on mobile devices.
- [x] 3.4 Add unit tests in `src/pages/csa/CSAPage.test.tsx` verifying card rendering and responsive modal triggers.

## 4. Anti-AI Slop & Quality Verification

- [x] 4.1 Audit all modified components to ensure zero sub-12px text, solid contrast surfaces, and institutional border radius (`rounded-lg`).
- [x] 4.2 Verify all user-facing strings are fully localized in `src/i18n/locales/en/` and `src/i18n/locales/id/`.
- [x] 4.3 Run `npx tsc --noEmit -p tsconfig.app.json` and fix any TypeScript compiler errors.
- [x] 4.4 Run `npm run lint` and verify no linting warnings or errors remain.
- [x] 4.5 Run `npm test` and verify all existing and new test suites pass.
