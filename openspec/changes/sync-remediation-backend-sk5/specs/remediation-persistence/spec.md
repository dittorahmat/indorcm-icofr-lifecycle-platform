## ADDED Requirements

### Requirement: Remediation Plan Persistence
The system SHALL store and retrieve all mandatory regulatory fields for remediation plans, including Related Function (Fungsi Terkait), Person In Charge (Penanggung Jawab), Plan Description, and Activity Details.

#### Scenario: Save Remediation Plan
- **WHEN** user submits the Remediation Form with all regulatory fields filled
- **THEN** system saves the data to the database and persists it across sessions

### Requirement: Action Plan Status Transition API
The system SHALL provide an API endpoint to update the status of an action plan through its lifecycle (Draft, In Review, In Progress, Resolved, Verified).

#### Scenario: Approve Remediation Plan
- **WHEN** a Line 2 user approves an action plan in the "In Review" status
- **THEN** system updates the status to "In Progress" and sets `isApprovedByLine2` to true

### Requirement: Remediation Timing Validation
The system SHALL calculate and persist whether a remediation plan is completed on or before the year-end (isBeforeYearEnd) based on the fiscal year settings.

#### Scenario: Mark Resolved before Year-End
- **WHEN** user marks an action plan as "Resolved" with a completion date within the current fiscal year
- **THEN** system flags the record as `isBeforeYearEnd` true
