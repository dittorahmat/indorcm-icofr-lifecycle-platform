## MODIFIED Requirements

### Requirement: Robust Visual-to-Tabular Data Linking
The system MUST automatically associate controls created or modified in the Visual BPM Editor with the corresponding `BPMProcess` record and its linked GL codes.

#### Scenario: Saving a diagram in Visual Editor
- **WHEN** the user saves a diagram in the BPM Editor
- **THEN** the backend SHALL resolve the `BPMProcess` ID by matching the Sub-Process name (case-insensitively, trimmed) within the same organization and year
- **AND** it SHALL populate the `bpmProcessId` and `fsliCodes` fields for all controls associated with the diagram's nodes in the database
- **AND** it SHALL ensure that if a match is not found, the operation logs a warning but maintains existing valid links if possible
