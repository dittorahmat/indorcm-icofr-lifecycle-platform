## ADDED Requirements

### Requirement: Unified Fiscal Year Selector
The system SHALL provide a global dropdown selector in the main header to define the "Working Fiscal Year" for the entire application.

#### Scenario: Switching global year
- **WHEN** user selects "2023" in the header dropdown
- **THEN** all operational pages (Scoping, RCM, BPM, Migration) SHALL automatically refresh their data to reflect the 2023 context.

### Requirement: Persistent Time Context
The selected fiscal year SHALL be persisted in the application state (Zustand) and synchronized with a URL search parameter (e.g., `?year=2023`) to allow for deep linking.

#### Scenario: Navigating between pages
- **WHEN** user is on Scoping page with year 2024 selected
- **AND** user clicks "RCM Matrix" in the sidebar
- **THEN** the RCM Matrix page SHALL load with the 2024 context automatically.
