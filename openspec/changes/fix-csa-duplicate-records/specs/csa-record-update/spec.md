## ADDED Requirements

### Requirement: Update CSA Record
The system SHALL allow updating existing CSA records without creating duplicates.
The `PUT /api/csa/:id` endpoint SHALL accept an update request.
The system SHALL perform transactional updates on `csaRecords` and `csaSamples`.

#### Scenario: Update existing CSA record
- **WHEN** user saves a draft for an existing assessment
- **THEN** the system updates the record and refreshes associated samples
- **THEN** no new records are created in the history

#### Scenario: Transactional integrity on update
- **WHEN** the update fails at the database level
- **THEN** the system MUST rollback all partial updates to maintain data consistency
