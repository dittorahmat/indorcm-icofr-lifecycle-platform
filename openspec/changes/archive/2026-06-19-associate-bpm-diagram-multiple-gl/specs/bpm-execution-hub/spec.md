## ADDED Requirements

### Requirement: Editor GL Account Configuration
The Visual BPM Editor SHALL allow users to associate the current diagram / sub-process with multiple GL codes via a searchable dropdown checkbox (multi-select) component.

#### Scenario: Selecting and saving multiple GL codes
- **WHEN** the user opens the "Linked GL Accounts" dropdown in the BPM Editor
- **THEN** the dropdown SHALL display all GL accounts under the selected FSLI, with the originating/current GL code pre-selected by default
- **AND WHEN** the user selects additional GL codes and saves the diagram
- **THEN** the backend SHALL store these associations in the database
- **AND** the sub-process SHALL be displayed in the BPMPage for all associated GL codes

## MODIFIED Requirements

### Requirement: Robust Visual-to-Tabular Data Linking
The system MUST automatically associate controls created or modified in the Visual BPM Editor with the corresponding `BPMProcess` record and all its linked GL codes.

#### Scenario: Saving a diagram in Visual Editor
- **WHEN** the user saves a diagram in the BPM Editor
- **THEN** the backend SHALL resolve the `BPMProcess` ID by matching the Sub-Process name (case-insensitively) within the same organization
- **AND** it SHALL populate the `bpmProcessId` and associate all linked GL codes from the diagram's process for all controls associated with the diagram's nodes in the database
