## 1. i18n Label Updates

- [x] 1.1 Update `src/i18n/locales/en/dashboard.json` to include "Open Deficiencies" and precise chart titles.
- [x] 1.2 Update `src/i18n/locales/id/dashboard.json` with corresponding Indonesian translations.

## 2. Deficiency Metric Synchronization

- [x] 2.1 Modify `Dashboard.tsx` to filter `deficienciesData.items` by `status === 'Open'` before passing to `deficiencyBySeverity` useMemo.
- [x] 2.2 Update Pie Chart total count display in `ComplianceCharts.tsx` to reflect the filtered "Open" status.

## 3. Control-to-Process Mapping Fix

- [x] 3.1 Modify `Dashboard.tsx` to pre-group controls by business process.
- [x] 3.2 Update `ComplianceCharts.tsx` to use the grouped control data for the bar chart instead of relying on RCM nested properties.

## 4. Verification

- [x] 4.1 Verify that KPI card "Open Deficiencies" count matches the total in the Pie Chart.
- [x] 4.2 Verify that the "Controls by Process" bar chart now shows non-zero values corresponding to the actual data.
- [x] 4.3 Run `npm run type-check` and `npm run lint` to ensure no regressions.
