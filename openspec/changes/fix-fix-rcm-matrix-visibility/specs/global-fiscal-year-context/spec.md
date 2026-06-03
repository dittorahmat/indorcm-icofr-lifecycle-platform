## ADDED Requirements

### Requirement: Fiscal year filtering in RCM Matrix
The RCM Matrix views (TLC and ITGC) SHALL only display Risks and Controls belonging to the selected fiscal year (Cycle).

#### Scenario: Switching cycles
- **WHEN** user selects "2024 Cycle" in the application header
- **THEN** system SHALL refresh the RCM Matrix to show only data for the year 2024

### Requirement: Global context synchronization
The RCM module MUST listen to the global `useFiscalYearStore` and synchronize its data fetching accordingly.

#### Scenario: Initial load
- **WHEN** user opens the RCM page
- **THEN** system SHALL automatically fetch data for the currently active global working year
