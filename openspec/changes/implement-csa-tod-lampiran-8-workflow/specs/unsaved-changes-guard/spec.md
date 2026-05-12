## MODIFIED Requirements

### Requirement: Standardized isDirty Detection
The system SHALL provide a standardized way to define the "dirty" state for various components, including forms, interactive diagrams, data grids, and the new TOD verification popup.

#### Scenario: TOD Form modification detection
- **WHEN** a user modifies any evaluation criteria in the Lampiran 8 TOD popup
- **THEN** the isDirty state for that popup SHALL become true
- **AND** the system SHALL trigger the `UnsavedChangesDialog` if the user attempts to close the modal without saving.
