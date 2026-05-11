## ADDED Requirements

### Requirement: Centralized Scoping Logic
The system SHALL provide a centralized service layer for all scoping-related database operations and business rules.

#### Scenario: Simulation Submission
- **WHEN** a simulation is submitted for approval
- **THEN** the system SHALL validate the current year status, update the simulation state, and create an audit log entry atomically

### Requirement: Regulatory Service Isolation
The system SHALL ensure that regulatory business rules (e.g., Line 2 validation requirements) are enforced in the service layer, not the router.

#### Scenario: Protected Scoping Operations
- **WHEN** a non-admin user attempts to purge scoping data
- **THEN** the system SHALL reject the request at the service layer level
