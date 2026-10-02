## Purpose

Provides unified maker-checker governance for modification and deletion of approved ICOFR entities, ensuring segregation of duties, formal change approvals, and reliable confirmation dialog fallbacks.

## ADDED Requirements

### Requirement: Maker-Checker Deletion Request on Approved Entities
The system SHALL require an authorized approval before deleting any ICOFR entity that has already reached `Approved` status when the approval workflow is active.

#### Scenario: Deleting an approved scoping simulation generates a deletion request
- **WHEN** a user initiates deletion of a Scoping Simulation with status `Approved` while approval workflow is enabled
- **THEN** the system SHALL NOT physically delete the simulation immediately
- **THEN** the system SHALL update the status to `Pending Deletion Approval` and record a deletion request with author justification

#### Scenario: Deleting a draft simulation executes directly
- **WHEN** a user initiates deletion of an unapproved simulation (status `Draft` or `Rejected`)
- **THEN** the system SHALL prompt for confirmation and physically delete the simulation upon confirmation without requiring an approval workflow

### Requirement: Maker-Checker Change Request on Approved Entities
The system SHALL require an authorized approval before applying changes to an already `Approved` ICOFR entity when the approval workflow is active.

#### Scenario: Editing an approved control generates a change request
- **WHEN** a user submits updates to an existing Control whose status is `Approved`
- **THEN** the system SHALL preserve the active approved version and stage the modifications as a `Pending Update Approval` change request
- **THEN** the system SHALL create a draft audit log entry in accordance with Regulation SK-5 Lampiran 6

#### Scenario: Checker approves the modification
- **WHEN** an authorized approver (e.g. Line 2 / CFO / Board of Commissioners) approves the change request
- **THEN** the system SHALL apply the staged changes, restore status to `Approved`, and finalize the regulatory audit trail

### Requirement: Mandatory Confirmation Dialog Fallback
When the approval workflow is disabled or not configured for an entity type, the system SHALL require an explicit institutional confirmation dialog before executing any edit or deletion.

#### Scenario: Direct deletion with workflow disabled requires confirmation modal
- **WHEN** a user initiates deletion of an entity while the approval workflow is disabled
- **THEN** the system SHALL display an institutional modal dialog (`useConfirm`) stating the item name and irreversible impact
- **THEN** the system SHALL NOT proceed with the deletion API call unless the user confirms (clicks Yes / Confirm)

#### Scenario: Elimination of raw browser confirms
- **WHEN** any user action triggers an edit or deletion confirmation
- **THEN** the system SHALL render the UI using institutional application dialogs rather than native `window.confirm()` or `window.alert()`

### Requirement: Regulatory Audit Logging on All Transitions
The system SHALL log all approval, rejection, direct confirmation, and execution events for audit trail inspection (SK-5 Lampiran 6).

#### Scenario: Logging a deletion approval event
- **WHEN** an approver confirms the deletion request of an entity
- **THEN** the system SHALL log the action with the approver ID, timestamp, entity ID, previous approved state, and approval remarks
