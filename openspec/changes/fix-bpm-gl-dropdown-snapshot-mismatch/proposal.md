## Why

The BPM Page currently displays an empty GL Code dropdown when an FSLI is selected if the active GL Snapshot does not match the snapshot used to create the active Materiality Simulation. This happens because the BPM Page fetches the globally "active" snapshot instead of the specific snapshot referenced by the simulation's `glSnapshotId`.

## What Changes

- **BPM Page Data Fetching**: Modify `BPMPage.tsx` to fetch the snapshot linked to the active simulation (`activeSim.glSnapshotId`).
- **Fallback Logic**: Implement fallback to the globally active snapshot if `glSnapshotId` is null (for legacy data).
- **Standardized Hooks**: Refactor `src/hooks/use-bpm.ts` to provide a unified way to fetch simulation-linked snapshots.
- **Analysis Modal Fix**: Update `SimulationListTable.tsx` to use the simulation's linked snapshot for Pareto calculations in the Significant Location Modal.

## Capabilities

### New Capabilities
- `linked-snapshot-context`: A shared context or hook to resolve the correct GL Snapshot based on a simulation ID.

### Modified Capabilities
- `scoping-bpm-integration`: Ensure deep-linking and data selection consistently respect the simulation-snapshot relationship.

## Impact

- `src/pages/bpm/BPMPage.tsx`: Fetching logic change.
- `src/components/scoping/SimulationListTable.tsx`: Modal data fetching.
- `src/hooks/use-bpm.ts`: New/Refactored hooks for data resolution.
- `shared/types.ts`: Ensure `MaterialitySimulation` includes `glSnapshotId` (already exists in DB and type, but verify consistency).