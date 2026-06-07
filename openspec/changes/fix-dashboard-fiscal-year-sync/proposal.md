## Why

The dashboard currently fails to synchronize its data and labels with the global fiscal year selection. This results in users seeing data from the default year (usually 2026) regardless of their selection in the header dropdown, creating a broken and confusing user experience.

## What Changes

- **Global State Integration**: Update `Dashboard.tsx` to consume the `workingYear` from `useFiscalYearStore`.
- **Reactive Data Fetching**: Modify TanStack Query keys and API endpoint calls in the dashboard to include the `workingYear`, ensuring data is refetched upon year change.
- **Dynamic UI Labels**: Refactor `DashboardKPIs` and `LifecycleProgress` components to accept and display the active `workingYear` instead of hardcoded strings.
- **API Parameter Support**: Ensure backend calls from the dashboard pass the `year` parameter for RCM, Controls, and Deficiencies.

## Capabilities

### New Capabilities
- `dashboard-fiscal-year-sync`: Automatic synchronization of all dashboard metrics, charts, and lifecycle indicators with the globally selected fiscal year.

### Modified Capabilities
<!-- No existing spec-level requirement changes; this is a fix/enhancement to existing behavior -->

## Impact

- **Frontend**: `src/pages/Dashboard.tsx`, `src/components/dashboard/DashboardKPIs.tsx`, `src/components/dashboard/LifecycleProgress.tsx`.
- **API**: `/api/rcm`, `/api/controls`, `/api/deficiencies`.
- **User Experience**: Immediate feedback and correct data context when switching fiscal years.
