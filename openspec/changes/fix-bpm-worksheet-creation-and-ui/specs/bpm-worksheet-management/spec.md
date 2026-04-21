## ADDED Requirements

### Requirement: Persist BPM Process Link
The system SHALL ensure that any control activity created within a BPM Worksheet is linked to its parent BPM Process by persisting the `bpmProcessId` attribute.

#### Scenario: Successful Control Creation
- **WHEN** a user clicks "Add Row In Worksheet"
- **THEN** the system SHALL create a new control record in the database with the correct `bpmProcessId` and return it in the response.

### Requirement: Line 1 Authoring Permissions
The system SHALL allow users with the "Line 1" role (both Staff and Manager) to create new control activities within the BPM Worksheet.

#### Scenario: Staff User Creates Row
- **WHEN** a user with Role "Line 1" and Level "Staff" submits a request to create a control
- **THEN** the system SHALL permit the operation and set the initial `bpmStatus` to "Draft".

### Requirement: Control Approval Workflow
The system SHALL provide endpoints for "Line 1" users to submit control changes for approval and for "Manager" level users to reject them.

#### Scenario: Submit for Approval
- **WHEN** a user triggers the "submit-for-approval" action on a control
- **THEN** the system SHALL update the `bpmStatus` to "Pending Approval" and log the event.

#### Scenario: Reject Changes
- **WHEN** a user with Level "Manager" triggers the "reject" action on a control
- **THEN** the system SHALL update the `bpmStatus` to "Rejected" and log the event.

### Requirement: Granular Worksheet Header
The BPM Worksheet header SHALL display the specific Account Name and Account Code (`noGL`) associated with the current BPM Process.

#### Scenario: Header Details Display
- **WHEN** the BPM Worksheet is loaded for a specific process
- **THEN** the header SHALL display the title and description using the correct `bpm` translation namespace and include the FSLI Name and GL Code.
