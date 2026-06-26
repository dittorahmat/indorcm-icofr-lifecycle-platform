## 1. Compliance Logic & Helpers

- [x] 1.1 Implement FSLI-level 2/3 coverage calculation in `materiality-calc.ts`.
- [x] 1.2 Implement aggregate operating/position value (Assets, Liabilities, Revenue, Expenses) 2/3 coverage calculation in `materiality-calc.ts`.
- [x] 1.3 Add helper in `materiality-calc.ts` to identify which specific entities/accounts are Soft Orange (included to meet the 2/3 FSLI threshold).
- [x] 1.4 Write unit tests in `materiality-calc.test.ts` to verify the calculations.

## 2. React Hook Integration

- [x] 2.1 Update `useScopingEditor` in `useScopingPage.ts` to calculate FSLI-level coverage and aggregate compliance based on `selectedEntityCodes`.
- [x] 2.2 Expose compliance data (coverage percentages and pass/fail indicators) to the consumer components.

## 3. UI Implementation

- [x] 3.1 Update `ScopingHealthDashboard.tsx` (Data Integrity tab) to render a visual card for 2/3 Compliance Check showing pass/fail status and warning messages for FSLI gaps.
- [x] 3.2 Update `SignificantLocationModal.tsx` to display the 2/3 compliance calculations as warning cues when adjusting Pareto thresholds or selecting locations.
- [x] 3.3 Add custom Tailwind styles and border highlights in `GLDataGrid.tsx` to color code row backgrounds (Green, Orange, Yellow) based on their scope classification.
- [x] 3.4 Update locale translation files (`locales/id/scoping.json` and `locales/en/scoping.json`) with localization keys for compliance checks, legends, and warning copy.

## 4. Verification & Validation

- [x] 4.1 Run TypeScript type check using `npm run type-check`.
- [x] 4.2 Run ESLint check using `npm run lint`.
- [x] 4.3 Verify compilation build using `npm run build`.
- [x] 4.4 Run unit tests with `npm test`.
