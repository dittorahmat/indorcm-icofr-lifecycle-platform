## ADDED Requirements

### Requirement: Agentic System Modifications
The system SHALL allow the AI to initiate specific system operations (write-tools) subject to user confirmation.

#### Scenario: AI schedules a CSA task
- **WHEN** user says "Tolong buatkan jadwal CSA untuk sub-proses Pajak minggu depan"
- **THEN** the AI SHALL request the execution of a `create_schedule` tool
- **AND** the system SHALL display a confirmation dialog to the user before committing the write operation.
