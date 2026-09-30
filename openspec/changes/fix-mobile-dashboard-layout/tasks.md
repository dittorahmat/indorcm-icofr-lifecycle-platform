## 1. Stepper & Card Layout Fixes

- [x] 1.1 Refactor `src/components/dashboard/LifecycleProgress.tsx` to include an adaptive mobile view (`md:hidden`) showing the current step, progress percentage, and clear non-overlapping label.
- [x] 1.2 Fix `src/components/dashboard/DashboardKPIs.tsx` layout constraints by adding `min-w-0` and responsive card padding to stop right-side card truncation.
- [x] 1.3 Ensure `src/components/layout/PageHeader.tsx` action buttons wrap properly into a neat 2-button grid on mobile viewports.

## 2. Shell & Viewport Overflow Constraints

- [x] 2.1 Refactor `src/components/layout/RootLayout.tsx` and `src/components/layout/AppLayout.tsx` to ensure `MainHeader.tsx` remains visible and fix root overflow issues.
- [x] 2.2 Add `overflow-x-hidden max-w-full` guards on `src/pages/Dashboard.tsx` container to eliminate horizontal scroll leakage on 360px–390px viewports.
- [x] 2.3 Adjust `AIFabButton.tsx` placement and dimensions so it does not collide with dashboard metric cards on mobile screens.

## 3. Verification & Quality Assurance

- [x] 3.1 Verify all text follows the minimum 12px rule and no decorative italics or glassmorphism are introduced.
- [x] 3.2 Run `npx tsc --noEmit -p tsconfig.app.json` and fix any TypeScript compiler issues.
- [x] 3.3 Run `npm run lint` and verify clean code standards.
- [x] 3.4 Run `npm test` and ensure all test suites pass.
