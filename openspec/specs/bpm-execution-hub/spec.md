# bpm-execution-hub Specification

## Purpose
TBD - created by archiving change fix-csa-control-visibility-and-header-ui. Update Purpose after archive.
## Requirements
### Requirement: Execution Hub Header UI
The system SHALL display the Sub-Process name as the primary title in the Execution Hub (BPMModal) header to provide immediate context to the user.

#### Scenario: Opening Execution Hub from BPM Page
- **WHEN** the user clicks on a Sub-Process name in the BPM list
- **THEN** the BPMModal SHALL display the Sub-Process name in large, bold text as the main title
- **AND** it SHALL display the GL Account Number and FSLI name as secondary metadata badges/labels

### Requirement: Robust Visual-to-Tabular Data Linking
The system MUST automatically associate controls created or modified in the Visual BPM Editor with the corresponding `BPMProcess` record and its linked GL codes.

#### Scenario: Saving a diagram in Visual Editor
- **WHEN** the user saves a diagram in the BPM Editor
- **THEN** the backend SHALL resolve the `BPMProcess` ID by matching the Sub-Process name (case-insensitively) within the same organization
- **AND** it SHALL populate the `bpmProcessId` and `fsliCodes` fields for all controls associated with the diagram's nodes in the database

