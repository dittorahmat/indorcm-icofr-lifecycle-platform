## ADDED Requirements

### Requirement: Line 1 BPM Management Access
The system SHALL allow users with the 'Line 1' role to create, update, and delete BPM processes.

#### Scenario: Line 1 creating a BPM process
- **WHEN** a user with the role 'Line 1' sends a `POST` request to `/api/bpm-processes`
- **THEN** the system SHALL grant access and process the request

#### Scenario: Line 1 updating a BPM process
- **WHEN** a user with the role 'Line 1' sends a `PATCH` request to `/api/bpm-processes/:id`
- **THEN** the system SHALL grant access and process the request

#### Scenario: Line 1 deleting a BPM process
- **WHEN** a user with the role 'Line 1' sends a `DELETE` request to `/api/bpm-processes/:id`
- **THEN** the system SHALL grant access and process the request
