## ADDED Requirements

### Requirement: Context-Aware Diagram Locking
The system SHALL determine the editability of a BPM diagram based on the user's active working year context rather than the current system calendar year.

#### Scenario: User works on a previous year
- **WHEN** the current system year is 2026 and the user has selected 2025 as the working year
- **THEN** the BPM diagrams for 2025 SHALL be editable in the BPM Editor

#### Scenario: User views an old audit baseline
- **WHEN** the user's selected working year is 2026 and they open a diagram from 2025
- **THEN** the diagram SHALL be in READ-ONLY mode and display a "LOCKED (Audit Baseline 2025)" indicator

### Requirement: Settings-Based Period Locking
The system SHALL prevent any modifications to BPM diagrams if the global `isPeriodLocked` setting is enabled for the organization.

#### Scenario: Locked Period
- **WHEN** the global `isPeriodLocked` flag is TRUE in the system settings
- **THEN** all BPM diagrams SHALL be locked for editing regardless of the year context

### Requirement: Save-Time Year Validation
The system SHALL ensure that every save operation (POST or PUT) includes and validates the correct `year` and `subProcess` associated with the diagram.

#### Scenario: Saving a diagram
- **WHEN** the user clicks "Save" in the BPM Editor
- **THEN** the system MUST send the `year` and `subProcess` fields in the request body to the backend for persistence
