## ADDED Requirements

### Requirement: Atomic Docking Synchronization
The system SHALL ensure that whenever a Risk or Control is linked to an Activity, the corresponding visual badge (node) is created or updated in the same state transaction as the data update.

#### Scenario: Linking a control to a risk
- **WHEN** user links a control to an existing risk in the BPM Editor sidebar
- **THEN** the Activity node data is updated AND a `docked-control` node appears at the top (`y: -12`) of the Activity node immediately.

### Requirement: Loading Safety
The BPM Editor SHALL handle missing or loading master data (RCM/Controls) without crashing or breaking the rendering of existing nodes.

#### Scenario: Master data loading
- **WHEN** the BPM Editor is initialized and `controlsData` is still being fetched (undefined)
- **THEN** the editor renders correctly without throwing "Cannot read properties of undefined (reading 'find')" errors.
