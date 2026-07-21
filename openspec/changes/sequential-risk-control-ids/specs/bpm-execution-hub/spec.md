## MODIFIED Requirements

### Requirement: Robust Visual-to-Tabular Data Linking
The system MUST automatically associate controls and risks created or modified in the Visual BPM Editor with the corresponding `BPMProcess` record and all its linked GL codes. Additionally, the backend SHALL assign these controls and risks structured, sequential IDs (based on the process prefix) during synchronization rather than random UUIDs, unless the user has overridden the IDs.

#### Scenario: Saving a diagram in Visual Editor
- **WHEN** the user saves a diagram in the BPM Editor
- **THEN** the backend SHALL resolve the `BPMProcess` ID by matching the Sub-Process name (case-insensitively) within the same organization
- **AND** it SHALL populate the `bpmProcessId` and associate all linked GL codes from the diagram's process for all controls associated with the diagram's nodes in the database
- **AND** it SHALL persist the custom structured sequential IDs (e.g. `R-ACCT-0001`, `C-ACCT-0001`) assigned to the risk and control records in the database.
