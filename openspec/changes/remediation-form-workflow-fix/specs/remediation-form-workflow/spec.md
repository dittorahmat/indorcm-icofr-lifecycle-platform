## ADDED Requirements

### Requirement: Modal remains open after saving Remediation Plan
The system SHALL preserve the open state of the Remediation Action Plan modal upon successfully saving form updates, allowing the user to view confirmation and perform further actions without re-opening the modal.

#### Scenario: User saves remediation plan
- **WHEN** the user submits the Remediation Action Plan form by clicking "Save Remediation Plan"
- **THEN** the action plan data is persisted to the backend
- **THEN** the modal dialog remains open
- **THEN** a success toast notification is displayed

### Requirement: Reset form dirty state on successful save
The system SHALL reset the form's dirty state (`isDirty`) to false immediately following a successful save of the Remediation Action Plan form.

#### Scenario: User submits workflow approval after saving
- **WHEN** the user saves the Remediation Action Plan form and subsequently clicks a workflow action (e.g., "Submit" or "Bypass & Finalize Approval")
- **THEN** the system executes the workflow action without triggering an "Unsaved Changes" warning

### Requirement: Explicit modal closure controls
The system SHALL provide explicit modal dismissal options (such as a "Close" / "Done" button or header close icon) so the user can close the modal when finished with editing and workflow actions.

#### Scenario: User closes modal manually
- **WHEN** the user clicks the "Close" button or the dialog close icon
- **THEN** the Remediation Action Plan modal closes
