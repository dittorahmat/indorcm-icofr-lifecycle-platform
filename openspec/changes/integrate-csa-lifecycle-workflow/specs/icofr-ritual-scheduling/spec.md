## ADDED Requirements

### Requirement: Schedule-Record Linkage
The system SHALL establish a formal link between compliance schedules and their corresponding assessment records using a unique schedule identifier.

#### Scenario: Linking record to schedule
- **WHEN** a user initiates a CSA from the Todo List
- **THEN** the system SHALL pass the `scheduleId` to the assessment form
- **AND** it SHALL store this `scheduleId` in the resulting `csa_records` table

### Requirement: Automated Status Propagation
The system SHALL automatically update the status of a schedule based on the lifecycle stage of its linked assessment record.

#### Scenario: Transition to In Progress
- **WHEN** a user saves a "Draft" of a CSA linked to a schedule
- **THEN** the system SHALL update the schedule status to "In Progress"

#### Scenario: Transition to Completed
- **WHEN** a user "Signs-off" a CSA linked to a schedule
- **THEN** the system SHALL update the schedule status to "Completed"
