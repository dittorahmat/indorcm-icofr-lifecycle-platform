## ADDED Requirements

### Requirement: BPM Process Auto-linking on Import
The backend `/api/migration/finalize` endpoint SHALL automatically associate the newly created `bpmProcesses` with the GL account code (`noGL`) and `fsliName` extracted from the RCM upload. This association MUST make the processes immediately visible on `BPMPage.tsx` when the user filters by the corresponding FSLI and GL Account.

#### Scenario: Finalizing RCM import with GL codes
- **WHEN** the user finalizes the RCM import with valid `accountCode` and FSLI values in the RCM rows
- **THEN** the backend `/api/migration/finalize` endpoint SHALL write these values to the `noGL` and `fsliName` columns in the `bpmProcesses` table
- **AND** the processes SHALL immediately appear on the BPM Page when the user selects that GL account

### Requirement: BPM Diagram Backlog Drag-and-Drop
The Visual BPM Editor (BPMEditor) SHALL display a "Migration Backlog" panel listing all unmapped risks and controls from the imported RCM for the active process. The user MUST be able to drag these items directly onto the React Flow canvas to generate pre-filled nodes with all RCM metadata.

#### Scenario: Dragging a control from the backlog to the canvas
- **WHEN** a user opens a process diagram in the BPM Editor
- **THEN** the editor SHALL show all unmapped RCM controls in the backlog panel
- **AND WHEN** the user drags a control node onto the canvas
- **THEN** the canvas SHALL create a new node pre-filled with the control's code, name, description, and metadata from the RCM
