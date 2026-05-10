## ADDED Requirements

### Requirement: Inline Row Editing Actions
The system SHALL provide row-level action controls for editing RCM records, replacing the existing "Edit Row" expand/collapse pattern.

#### Scenario: Edit initiation
- **WHEN** user clicks the edit (✎) icon in the action column
- **THEN** row cells switch to active input state and display save (✓) and cancel (✕) icons

#### Scenario: Save row changes
- **WHEN** user clicks the save (✓) icon
- **THEN** system performs a scoped update for that row only
- **AND** row returns to view mode upon success

#### Scenario: Cancel row changes
- **WHEN** user clicks the cancel (✕) icon
- **THEN** system reverts input fields to original data
- **AND** row returns to view mode
