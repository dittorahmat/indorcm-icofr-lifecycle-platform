## ADDED Requirements

### Requirement: Dashboard Fiscal Year Synchronization
The Dashboard system SHALL synchronize all data visualizations and labels with the globally selected fiscal year from the `useFiscalYearStore`.

#### Scenario: Switching Fiscal Year Refreshes Dashboard
- **WHEN** the user selects a different fiscal year from the global selector
- **THEN** the dashboard system SHALL automatically refetch data from `/api/rcm`, `/api/controls`, and `/api/deficiencies` with the new year parameter
- **AND** the dashboard system SHALL update all KPI cards, charts, and progress bars to reflect the new data

### Requirement: Dynamic Year Labeling
All dashboard components that display a specific year SHALL dynamically render the value from the global `workingYear` state.

#### Scenario: KPI Card Label Update
- **WHEN** the fiscal year is set to "2024"
- **THEN** the DashboardKPIs component SHALL display "Reporting Cycle: 2024" instead of "2026"

#### Scenario: Lifecycle Progress Label Update
- **WHEN** the fiscal year is set to "2025"
- **THEN** the LifecycleProgress component SHALL display "FY 2025 Cycle" instead of "FY 2026 Cycle"
