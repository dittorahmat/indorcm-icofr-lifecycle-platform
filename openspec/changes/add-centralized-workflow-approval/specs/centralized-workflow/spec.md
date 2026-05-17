## ADDED Requirements

### Requirement: Centralized Workflow Data Schema
The system SHALL extend the `bpm_processes` and `action_plans` database tables to include `workflow_status` (string) and `workflow_history` (JSONB) fields to track current states and historical actions.

#### Scenario: Database schema validation
- **WHEN** the application starts or migrations are run
- **THEN** the `bpm_processes` and `action_plans` tables must contain the `workflow_status` and `workflow_history` columns.

### Requirement: BPM Process State Machine
The system SHALL enforce a state machine for BPM processes with the following statuses: `Draft`, `Pending Review`, `Pending Approval`, `Approved`, and `Rejected`.

#### Scenario: Submitting a Draft BPM for Review
- **WHEN** a user submits a BPM process currently in `Draft` state for review
- **THEN** the status updates to `Pending Review` and a history entry is appended.

#### Scenario: Rejecting a Pending BPM
- **WHEN** an authorized user rejects a BPM in `Pending Review` or `Pending Approval`
- **THEN** the system MUST require a rejection note, the status reverts to `Rejected`, and a history entry is appended.

### Requirement: Remediation Action Plan State Machine
The system SHALL enforce a state machine for Remediation action plans with the following statuses: `Ineffective`, `In Review`, `In Approval`, and `Resolved`.

#### Scenario: Submitting a remediation plan
- **WHEN** a user submits an action plan currently in `Ineffective` state
- **THEN** the status updates to `In Review` and a history entry is appended.

#### Scenario: Re-testing Failure
- **WHEN** a reviewer rejects an action plan in `In Review` (e.g., due to re-testing failure)
- **THEN** the system MUST require a rejection note, the status reverts to `Ineffective`, and a history entry is appended.

### Requirement: Mandatory Notes for Negative Actions
The system SHALL require a non-empty `note` field whenever a user performs a `Reject` or `Rollback` workflow action.

#### Scenario: Attempting to reject without a note
- **WHEN** a user triggers the `Reject` action but provides an empty note
- **THEN** the system rejects the request and prompts the user that a note is mandatory.

### Requirement: WorkflowPanel Component Locking
The `WorkflowPanel` UI component SHALL signal to its parent container to lock (disable) form inputs and editors if the current entity status is anything other than `Draft`, `Rejected`, or `Ineffective`.

#### Scenario: Viewing an Approved BPM Process
- **WHEN** a user opens a BPM process with the `Approved` status
- **THEN** the `WorkflowPanel` renders the history and a "Rollback" button (if authorized), and the main BPM editor is placed in a read-only state.
