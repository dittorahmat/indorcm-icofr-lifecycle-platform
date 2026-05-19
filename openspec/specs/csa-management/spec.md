# csa-management Specification

## Purpose
TBD - created by archiving change outlook-style-execution-hub. Update Purpose after archive.
## Requirements
### Requirement: Calendar Grid Visualization
The system SHALL display CSA schedules in a full-width monthly grid.

#### Scenario: Visual status of overdue CSA
- **WHEN** a CSA schedule is not completed and its planned date is in the past
- **THEN** it SHALL be displayed with a Red background in the calendar grid

#### Scenario: Visual status of completed CSA
- **WHEN** a CSA schedule status is 'Completed'
- **THEN** it SHALL be displayed with a Green background in the calendar grid

### Requirement: Enforce Granular Verification
The system SHALL ensure that a CSA assessment can only be marked as 'Effective' if all granular verification points (Transaction x Control) have been verified and documented.

#### Scenario: Validation during sign-off
- **WHEN** the user attempts to sign-off a CSA as Effective
- **THEN** the system SHALL check if every verification point has attached evidence and an 'Implemented' status
- **AND** it SHALL block the sign-off if any point is missing documentation or has failed the test

### Requirement: Case-Insensitive Control Filtering
The system SHALL retrieve and display controls in the CSA Assessment and Worksheet tabs regardless of text casing in the Sub-Process name.

#### Scenario: Searching for controls by name
- **WHEN** the system filters controls for a specific Sub-Process (e.g., "Penerimaan setoran tunai")
- **THEN** it SHALL include controls associated with names like "Penerimaan Setoran Tunai" or "PENERIMAAN SETORAN TUNAI"
- **AND** it SHALL prioritize matching by `bpmProcessId` if available, using the name match as a robust fallback

### Requirement: AI-Enabled CSA Inquiries
The system SHALL allow users to query the status, schedules, and evidence of CSA activities via the AI Assistant.

#### Scenario: Querying overdue CSA via AI
- **WHEN** user asks "What CSA tasks are overdue?"
- **THEN** the AI SHALL call the relevant tool to retrieve past-due `csa_schedules` assigned to the user
- **AND** provide a summarized list with links to the execution pages

### Requirement: Lifecycle Phase Alignment
The system SHALL associate CSA activities primarily with the 'Implementasi & Pemantauan' lifecycle stage.

#### Scenario: CSA status influence on lifecycle
- **WHEN** the system evaluates the overall ICOFR progress
- **THEN** it SHALL use the status of csa_schedules to determine progress within the 'Implementasi & Pemantauan' stage

