## ADDED Requirements

### Requirement: Integrated History Tab in Property Sheet
The system SHALL include a "History" tab in the `RegulatoryPropertySheet` component to display the audit trail (Change Log) for the selected entity (Risk or Control).

#### Scenario: Viewing change history
- **WHEN** user selects a control and opens the History tab in the Property Sheet
- **THEN** the system displays a list of changes including timestamp, user, field changed, old value, and new value.

### Requirement: Entity-Based Audit Log Filtering
The backend API SHALL support filtering audit logs by `entityId` to enable the entity-specific history view.

#### Scenario: Fetching entity history
- **WHEN** the frontend requests `/api/changelogs?entityId=CTRL-001`
- **THEN** the API returns only log entries where `entityId` matches `CTRL-001`.

### Requirement: Safety Navigation Guard Integration
The system SHALL use the `useUnsavedChanges` hook to protect against data loss when editing ELC mapping or metadata.

#### Scenario: Warning on navigation
- **WHEN** user modifies COSO mapping and attempts to navigate away without saving
- **THEN** the system displays a confirmation dialog warning about unsaved changes.
