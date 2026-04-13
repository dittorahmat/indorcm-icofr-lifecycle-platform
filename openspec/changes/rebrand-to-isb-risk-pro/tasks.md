## 1. Source Code — UI Component Updates

- [x] 1.1 Update `src/components/layout/MainHeader.tsx`: replace "IndoRCM Pro" with "ISB Risk Pro"
- [x] 1.2 Update `src/components/app-sidebar.tsx`: replace both occurrences of "IndoRCM Pro" with "ISB Risk Pro"
- [x] 1.3 Update `src/pages/LoginPage.tsx`: replace "IndoRCM Pro" with "ISB Risk Pro"
- [x] 1.4 Update `src/pages/WelcomePage.tsx`: replace "IndoRCM Pro" with "ISB Risk Pro"
- [x] 1.5 Update `src/pages/HomePage.tsx`: replace "IndoRCM Pro" and "IndoRCM Control Coverage" with "ISB Risk Pro" and "ISB Risk Control Coverage"
- [x] 1.6 Update `src/pages/reports/ReportsPage.tsx`: replace all 3 occurrences of "IndoRCM Pro" with "ISB Risk Pro" and update version to v2.0
- [x] 1.7 Update `src/components/reports/RegulatoryAppendices.tsx`: replace "IndoRCM Pro Compliance Engine" with "ISB Risk Pro Compliance Engine"

## 2. Documentation Updates

- [x] 2.1 Update `USAGE_GUIDE.md`: replace all occurrences of "IndoRCM Pro" with "ISB Risk Pro"
- [x] 2.2 Update `README.md`: replace any references to the old brand name
- [x] 2.3 Update `docs/PRESENTASI-AI-USE-CASES.md`: replace "PT IndoRCM ICOFR Lifecycle Platform" with "PT ISB Risk ICOFR Lifecycle Platform"

## 3. Verification & Cleanup

- [x] 3.1 Run `grep -ri "IndoRCM\|Indo RCM\|indorcm\|indo-rcm" src/ docs/` and confirm zero remaining hits in source and active docs
- [x] 3.2 Run `vite build` to confirm no compilation errors
- [x] 3.3 Visually verify login page, home page, sidebar, and report page show "ISB Risk Pro"
- [x] 3.4 Remove `src/pages/HomePage.backup.tsx` if it still contains old brand references (or update it too)
