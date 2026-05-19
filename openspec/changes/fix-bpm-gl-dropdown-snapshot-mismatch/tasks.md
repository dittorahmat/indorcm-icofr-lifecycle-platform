## 1. Refactor Hooks and Shared Logic

- [x] 1.1 Create/Refactor `useSimulationSnapshot` hook in `src/hooks/use-bpm.ts` with fallback logic
- [x] 1.2 Update `shared/types.ts` to ensure `MaterialitySimulation` includes `glSnapshotId` and it's properly typed

## 2. BPM Page Implementation

- [x] 2.1 Refactor `BPMPage.tsx` to use the linked snapshot from `activeSim.glSnapshotId`
- [x] 2.2 Add loading skeleton/spinner for snapshot fetching in `BPMPage`
- [x] 2.3 Implement error state if linked snapshot is missing

## 3. Scoping Analysis Fixes

- [x] 3.1 Update `SimulationListTable.tsx` to use the simulation's linked snapshot for the Significant Location Modal
- [x] 3.2 Verify Pareto calculation in the modal correctly uses the linked snapshot data

## 4. Verification and Cleanup

- [x] 4.1 Verify case-insensitive FSLI matching still works correctly across all components
- [x] 4.2 Perform E2E check: Upload new snapshot, mark active, open old simulation in BPM, verify dropdowns are NOT empty
- [x] 4.3 Remove debug scripts `debug-db.ts`, `debug-sim.ts`, and `debug-gl.ts`