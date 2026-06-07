## ADDED Requirements

### Requirement: Safe BPM Process Deletion
The system SHALL allow users to delete a BPM process even if it is referenced by controls or CSA records.

#### Scenario: Deleting a process with existing controls
- **WHEN** a user deletes a BPM process that is linked to one or more controls
- **THEN** the system SHALL set the `bpmProcessId` of those controls to `null`
- **AND** it SHALL successfully delete the BPM process record

#### Scenario: Deleting a process with existing CSA records
- **WHEN** a user deletes a BPM process that has associated CSA records
- **THEN** the system SHALL set the `bpmProcessId` of those CSA records to `null`
- **AND** it SHALL successfully delete the BPM process record
