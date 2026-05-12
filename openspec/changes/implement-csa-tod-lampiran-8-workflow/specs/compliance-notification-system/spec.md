## MODIFIED Requirements

### Requirement: Notification Triggering
The system SHALL trigger a notification entry when a scheduled activity reaches its configured reminder interval or when a workflow transition occurs (e.g., Line 1 submission).

#### Scenario: Alert for Line 2 Review
- **WHEN** a Line 1 user submits a CSA record
- **THEN** the system SHALL generate a notification for Line 2 (Fungsi ICOFR) users
- **AND** the notification SHALL indicate that a new CSA is ready for TOD verification (Lampiran 8).
