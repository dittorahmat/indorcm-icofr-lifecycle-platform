## ADDED Requirements

### Requirement: Multi-Stage CSA Pengerjaan (Drafting)
The system SHALL allow users to save their progress on a CSA assessment as a "Draft" without performing biometric authentication or meeting mandatory evidence requirements.

#### Scenario: Saving a draft
- **WHEN** the user clicks "Simpan Draft" in the CSA Assessment tab
- **THEN** the system SHALL save the current sample results and comments to the database
- **AND** it SHALL NOT require biometric authentication
- **AND** it SHALL NOT block the save if evidence is missing for "Pass" points

### Requirement: Progress Persistence
The system SHALL ensure that saved drafts remain visible and editable when the user re-opens the assessment for the same process and period.

#### Scenario: Resuming a draft
- **WHEN** the user opens a previously drafted CSA assessment
- **THEN** the system SHALL pre-populate the form with all saved sample results, comments, and evidence links

## MODIFIED Requirements

### Requirement: Calendar Grid Visualization (Sync'd)
The system SHALL display CSA schedules in a full-width monthly grid with synchronized colors reflecting progress and urgency.

#### Scenario: Visual status of In-Progress CSA
- **WHEN** a CSA schedule has a linked draft record and the status is 'In Progress'
- **AND** the planned date is NOT in the past
- **THEN** it SHALL be displayed with a Yellow background in the calendar grid

#### Scenario: Visual status of late In-Progress CSA
- **WHEN** a CSA schedule has a linked draft record and the status is 'In Progress'
- **AND** the planned date is in the past
- **THEN** it SHALL be displayed with a Pulsing Red background in the calendar grid

#### Scenario: Visual status of overdue CSA
- **WHEN** a CSA schedule status is 'Not Started' and its planned date is in the past
- **THEN** it SHALL be displayed with a Solid Red background in the calendar grid

#### Scenario: Visual status of completed CSA
- **WHEN** a CSA schedule status is 'Completed'
- **THEN** it SHALL be displayed with a Green background in the calendar grid
