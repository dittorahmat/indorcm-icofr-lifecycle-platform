## Why

User reported discrepancies in the Dashboard metrics:
1. The Deficiency KPI card (counting only 'Open') does not match the total in the Pie Chart (counting all statuses).
2. The Controls by Process bar chart shows 0 for all processes because it relies on a nested `.controls` property in RCM data that is not populated by the backend.

These discrepancies reduce user trust in the system's accuracy and hinder the "Action Center" purpose of the dashboard.

## What Changes

- **Modified Deficiency Metric Logic**: Update the dashboard severity breakdown calculation to filter for 'Open' status, ensuring consistency with the main KPI card.
- **Fixed Control Mapping in Charts**: Refactor the bar chart logic to correctly map controls to business processes using the `controlsData` already available in the dashboard context.
- **UI Clarification**: Update KPI and chart labels to be more precise (e.g., explicitly stating "Open Deficiencies").

## Capabilities

### New Capabilities
- `dashboard-analytics-consistency`: Ensures that all dashboard visualizations and KPI cards use consistent filtering and data mapping logic.

### Modified Capabilities
- `remediation-tracking`: Updated how deficiency status is aggregated for high-level reporting.

## Impact

- `src/pages/Dashboard.tsx`: Main logic for data aggregation.
- `src/components/dashboard/ComplianceCharts.tsx`: Visualization logic for bar and pie charts.
- `src/components/dashboard/DashboardKPIs.tsx`: KPI labels and display.
