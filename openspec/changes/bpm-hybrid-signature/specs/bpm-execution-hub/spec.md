## ADDED Requirements

### Requirement: Hybrid Signature Sign-off Footer
The BPM Document View canvas footer SHALL display signature blocks for "Disusun Oleh" (Lini 1), "Direview Oleh" (Lini 2), and "Disetujui Oleh" (CFO). By default, these signature blocks SHALL be auto-populated using digital sign-off events from the process's `workflowHistory`, but they MUST allow manual override editing directly in the UI.

#### Scenario: Defaulting from Workflow History
- **WHEN** the BPM Document View is opened
- **AND** there are no manual overrides saved in the diagram's metadata
- **THEN** the system SHALL search the `workflowHistory` array
- **AND** populate the Lini 1 signature name and date with the user who performed the most recent "Submit" action (falling back to the diagram creator if not submitted yet)
- **AND** populate the Lini 2 signature name and date with the user who performed the most recent "Review" action
- **AND** populate the CFO signature name with the user who performed the most recent "Approve" action

#### Scenario: Editing and Saving Overrides
- **WHEN** the user edits the name or date fields in any signature block in the Document View UI
- **THEN** the system SHALL update its local state with the overridden values
- **AND WHEN** the user saves the diagram (clicks "Save Flow" or updates property sheets)
- **THEN** the system SHALL persist the overridden signature names and dates inside the diagram's `metadata.signatures` field in the database
- **AND WHEN** the Document View is subsequently opened
- **THEN** the system SHALL load the saved overrides from `metadata.signatures` instead of falling back to the `workflowHistory` values

#### Scenario: Printing/Exporting Clean PDF Layout
- **WHEN** the user exports the diagram to PDF (via `exportToImage` which captures `#bpm-document-canvas`)
- **THEN** the signature input elements in the footer SHALL render without borders or backgrounds, matching static printed text
