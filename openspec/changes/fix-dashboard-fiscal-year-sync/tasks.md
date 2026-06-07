## 1. Component Refactoring

- [x] 1.1 Update `src/components/dashboard/DashboardKPIs.tsx` to accept and use `workingYear` prop for dynamic labeling.
- [x] 1.2 Update `src/components/dashboard/LifecycleProgress.tsx` to accept and use `workingYear` prop for dynamic labeling.

## 2. Dashboard Integration

- [x] 2.1 Import `useFiscalYearStore` in `src/pages/Dashboard.tsx` to access the global state.
- [x] 2.2 Update `rcmData` query in `Dashboard.tsx` to include `workingYear` in the query key and pass it as a parameter to the API call.
- [x] 2.3 Update `controlsData` query in `Dashboard.tsx` to include `workingYear` in the query key and pass it as a parameter to the API call.
- [x] 2.4 Update `deficienciesData` query in `Dashboard.tsx` to include `workingYear` in the query key and pass it as a parameter to the API call.
- [x] 2.5 Pass the `workingYear` prop to `LifecycleProgress` and `DashboardKPIs` components within the `Dashboard.tsx` render function.

## 3. Verification

- [x] 3.1 Manually verify that dashboard metrics and charts update immediately when the fiscal year is changed in the header.
- [x] 3.2 Confirm that year-specific labels (e.g., "FY 2026 Cycle") correctly reflect the selected year.
- [x] 3.3 Run `npm run type-check` to ensure no type regressions were introduced.
- [x] 3.4 Run `npm run lint` to verify code style compliance.
- [x] 3.5 Execute `npm run build` to confirm the production build is successful.
