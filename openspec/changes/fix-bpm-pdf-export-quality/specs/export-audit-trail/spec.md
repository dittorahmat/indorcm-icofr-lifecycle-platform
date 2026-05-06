## ADDED Requirements

### Requirement: Export Event Logging
The system MUST log every successful diagram export event to the database to ensure accountability and regulatory compliance.

#### Scenario: Successful log creation
- **WHEN** a user successfully generates and downloads a BPM PDF
- **THEN** the system SHALL create a record in the `bpm_exports` table with the diagram ID, user ID, filename, and timestamp

### Requirement: Export History Retrieval
The system SHALL provide an API to retrieve the export history for a specific organization or diagram.

#### Scenario: Fetching organization exports
- **WHEN** an admin requests the export history for their organization
- **THEN** the system returns a list of all export events sorted by date
