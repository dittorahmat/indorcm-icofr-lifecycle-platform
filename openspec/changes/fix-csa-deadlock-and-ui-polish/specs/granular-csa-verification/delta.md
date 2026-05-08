# DELTA: granular-csa-verification

## Requirements

### Requirement: Non-Blocking Draft Editing
The system SHALL allow users to modify verification points, upload evidence, and add remarks for assessments that are currently in a "Draft" status.

#### Scenario: Editing an existing draft
- **GIVEN** a CSA record with `isDraft: true` is loaded
- **WHEN** the user navigates to the assessment form
- **THEN** all verification inputs (checkboxes, textareas, upload buttons) SHALL be enabled
- **AND** the "Effective" status radio button SHALL become enabled only when all verification points are marked as passed.

### Requirement: Evidence Upload Feedback
The system SHALL provide immediate visual feedback during the evidence upload process.

#### Scenario: Uploading evidence
- **WHEN** the user clicks the upload button on a verification point
- **THEN** a loading spinner SHALL appear on the button
- **AND** the button SHALL be disabled until the upload completes or fails.
