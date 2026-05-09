## ADDED Requirements

### Requirement: Transactional Scoping Operations
The system SHALL ensure that all multi-step scoping operations (e.g., Carry Forward) are performed within a database transaction to maintain data consistency.

#### Scenario: Transaction rollback on failure
- **WHEN** a Carry Forward operation encounters an error during the RCM cloning step
- **THEN** all previous steps (e.g., Diagram cloning) SHALL be rolled back and the system SHALL remain in the previous state

### Requirement: Transaction Success Notification
The system SHALL notify the user upon successful completion of a complex scoping operation.

#### Scenario: Successful Carry Forward
- **WHEN** a Carry Forward operation completes successfully
- **THEN** the system SHALL display a success toast and create a notification entry
