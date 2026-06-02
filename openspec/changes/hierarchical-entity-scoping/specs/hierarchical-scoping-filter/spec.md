## ADDED Requirements

### Requirement: Hierarchical Tri-state Filter
The Scoping Data Grid SHALL include a hierarchical tree filter with tri-state checkbox support (Checked, Unchecked, Indeterminate) for selecting entities.

#### Scenario: Selecting a parent entity in filter
- **WHEN** a user checks a parent entity in the hierarchical filter
- **THEN** all its children and sub-children SHALL be automatically selected
- **AND** the data grid SHALL update to show data for the entire branch

### Requirement: Filter State Persistence in Scoping Session
The system SHALL maintain the active entity filter state throughout the user's scoping session in the `ScopingEditorContent`.

#### Scenario: Navigating within scoping editor
- **WHEN** a user applies an entity filter and navigates between different tabs in the Scoping Editor
- **THEN** the entity filter SHALL remain applied to the current view
