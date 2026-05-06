## ADDED Requirements

### Requirement: Master Procedure Templates
The system SHALL allow managers to define standard audit procedures for each business process in the BPM module.

#### Scenario: Saving a standard procedure
- **WHEN** user edits a BPM process and fills the "Standard Test Procedure" field
- **THEN** system SHALL store this text in the database linked to that process

### Requirement: Procedure Auto-population
The system SHALL automatically populate the "Test Procedure" field in a new CSA assessment using the standard procedure defined in the master BPM data.

#### Scenario: Starting new CSA
- **WHEN** user initiates a new CSA for a process with a standard procedure
- **THEN** the assessment form SHALL be pre-filled with the standard procedure text
- **AND** it SHALL remain editable for the specific assessment session
