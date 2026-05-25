## ADDED Requirements

### Requirement: Modal-Based Smart Import
The system SHALL provide a multi-step modal wizard on the Scoping page triggered by the "Upload GL" button.

#### Scenario: Launching the wizard
- **WHEN** user clicks "Upload GL" in the Scoping header
- **THEN** the Smart Import Wizard modal SHALL appear.

### Requirement: Synchronous Data Refresh
The system SHALL refresh the Scoping page's tables (Simulations and Master Data GL) immediately after the Smart Import Wizard is finalized and closed.

#### Scenario: Successful import refresh
- **WHEN** user completes the migration in the modal and clicks "Finalize"
- **AND** the modal closes
- **THEN** the Scoping table SHALL show the new data without a manual page refresh.
