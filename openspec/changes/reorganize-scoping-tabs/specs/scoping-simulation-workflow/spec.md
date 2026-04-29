## ADDED Requirements

### Requirement: Simulation Data Integrity Tab
The system SHALL provide a dedicated "Data Integrity" tab within the scoping simulation editor to display statistical and integrity checks of the GL data.

#### Scenario: Navigating to Integrity Tab
- **WHEN** a user is in the Scoping Editor and clicks the "Data Integrity" tab
- **THEN** the system displays the Scoping Health Dashboard including balance checks and Benford's Law analysis.

### Requirement: Localized Tab Labels
The system SHALL use localized labels for all scoping simulation tabs to ensure accessibility for different language speakers.

#### Scenario: Switching Language
- **WHEN** the user switches the application language to Indonesian
- **THEN** the tabs are labeled "Ruang Lingkup", "Log Aktivitas", and "Integritas Data".

## MODIFIED Requirements

### Requirement: Simulation Tab Structure
The scoping simulation view SHALL be organized into a three-tab layout to improve information architecture and visibility of the main data grid.

#### Scenario: Initial View
- **WHEN** a user opens a scoping simulation
- **THEN** the system defaults to the "Scoping Worksheet" tab and renders only the GL Data Grid without the health dashboard.
