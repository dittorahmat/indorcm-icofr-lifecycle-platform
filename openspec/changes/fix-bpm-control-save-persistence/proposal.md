## Why

Currently, when a user adds a second or subsequent control to a node in the BPM Editor, the data is not persisted to the database. This occurs because the frontend initializes new controls with a `null` `controlId`, and the backend service strictly ignores any mapping pairs where the `controlId` is missing. This results in data loss and inconsistency between the visual diagram and the RCM database.

## What Changes

- **Frontend (RegulatoryPropertySheet)**: Modify the `addControlToRisk` function to generate a stable, permanent ID (prefixed with `C-`) immediately upon creation.
- **Frontend (RegulatoryPropertySheet)**: Update the internal state to use this generated ID as the `controlId`, ensuring it is sent to the backend during the save mutation.
- **Frontend (BPMEditor)**: Ensure that the `updateNodeData` logic correctly handles multiple controls for badge rendering and state synchronization.

## Capabilities

### New Capabilities
- `bpm-control-persistence`: Ensures that all Risk-Control mappings created or modified within the BPM Editor are correctly identified and persisted to the underlying database.

### Modified Capabilities
- `rcm-risk-control-accordion`: Update the requirement to ensure stable identity for dynamically added controls to prevent UI flicker and data loss.

## Impact

- **Affected Code**: `src/components/rcm/properties/RegulatoryPropertySheet.tsx`, `src/components/rcm/BPMEditor.tsx`.
- **APIs**: `PUT /api/bpm-diagrams/:id` (behavioral impact - will now receive valid IDs for all controls).
- **Database**: `controls`, `rcm_controls`, `bpm_node_rcms` tables will now correctly reflect multiple controls per node.
