## ADDED Requirements

### Requirement: Audit Log API Exposure
The system SHALL expose an API endpoint at `/api/changelogs` that allows authorized users to retrieve system audit logs.

#### Scenario: Retrieving audit logs
- **WHEN** an authorized user (Admin/Line 2) requests `/api/changelogs`
- **THEN** the system returns a list of audit log entries with `dataBefore`, `dataAfter`, and `description`

### Requirement: Centralized Audit Logging
All system-wide entity mutations (Create, Update, Delete) SHALL be logged through a centralized service that handles automated difference detection.

#### Scenario: Updating an RCM record
- **WHEN** a user updates a description in an RCM record
- **THEN** the system automatically generates an audit log entry highlighting the specific field changed
