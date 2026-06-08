## MODIFIED Requirements

### Requirement: Robust Visual-to-Tabular Data Linking
The system MUST automatically associate controls created or modified in the Visual BPM Editor with the corresponding `BPMProcess` record and its linked GL codes, while enforcing strict temporal consistency.

#### Scenario: Saving a diagram in Visual Editor
- **WHEN** the user saves a diagram in the BPM Editor
- **THEN** the backend SHALL resolve the `BPMProcess` ID by matching the Sub-Process name (case-insensitively) AND the diagram's `year` within the same organization
- **AND** it SHALL populate the `bpmProcessId`, `year`, and `fsliCodes` fields for all controls associated with the diagram's nodes in the database, overriding any existing year mismatches
