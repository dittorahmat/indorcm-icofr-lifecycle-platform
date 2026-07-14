## 1. Translation Updates

- [x] 1.1 Update `src/i18n/locales/en/dashboard.json` to configure parameters `{{days}}` for `remediationAvgDays` and `{{percent}}` for `line2Percent`.
- [x] 1.2 Update `src/i18n/locales/id/dashboard.json` to configure parameters `{{days}}` for `remediationAvgDays` and `{{percent}}` for `line2Percent`.

## 2. Dynamic Metric Implementation in Dashboard

- [x] 2.1 Integrate action plans query `/api/actionplans` into `src/pages/Dashboard.tsx` to get actual completion dates.
- [x] 2.2 Calculate dynamic `csaCompletion` rate based on active controls for the active fiscal year.
- [x] 2.3 Calculate dynamic average remediation days (velocity) using the deficiency `identifiedDate` and action plans' `actualCompletionDate`.
- [x] 2.4 Calculate dynamic `line2Percent` validation percentage from completed controls for the active fiscal year.
- [x] 2.5 Pass the dynamically calculated `csaCompletion` rate, remediation velocity, and Line 2 validation rate to their respective child components or rendering elements in `Dashboard.tsx`.

## 3. Mandat Penyelesaian Tahap & Quality Assurance

- [x] 3.1 Verify i18n localization checks pass.
- [x] 3.2 Run `npm run type-check` to verify TypeScript compile-time safety.
- [x] 3.3 Run `npm run lint` to enforce formatting and coding standards.
- [x] 3.4 Run `npm run build` to confirm build succeeds without errors.
- [x] 3.5 Run `npm test` to verify no regressions in existing tests.
