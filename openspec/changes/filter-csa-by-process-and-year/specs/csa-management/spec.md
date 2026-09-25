## ADDED Requirements

### Requirement: Scoped CSA History Retrieval
The system SHALL filter CSA assessment history records by business sub-process identifier and active fiscal year.

#### Scenario: User views CSA history within BPM worksheet
- **WHEN** the user opens the CSA tab in the BPM worksheet for a specific sub-process and working fiscal year
- **THEN** the system SHALL query and display only the CSA records associated with that `bpmProcessId` and matching the specified `year`
- **AND** assessments from other business sub-processes or other fiscal years SHALL NOT be displayed in the history list

#### Scenario: Querying CSA records with task schedule context
- **WHEN** the system or user queries CSA records with a specific `scheduleId`
- **THEN** the system SHALL return only the CSA record matching that `scheduleId`
