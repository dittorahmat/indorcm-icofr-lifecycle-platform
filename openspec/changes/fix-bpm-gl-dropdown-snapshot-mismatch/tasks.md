## 1. Refactor Hooks and Shared Logic

- [ ] 1.1 Create/Refactor `useSimulationSnapshot` hook in `src/hooks/use-bpm.ts` with fallback logic
- [ ] 1.2 Update `shared/types.ts` to ensure `MaterialitySimulation` includes `glSnapshotId` and it's properly typed

## 2. BPM Page Implementation

- [ ] 2.1 Refactor `BPMPage.tsx` to use the linked snapshot from `activeSim.glSnapshotId`
- [ ] 2.2 Add loading skeleton/spinner for snapshot fetching in `BPMPage`
- [ ] 2.3 Implement error state if linked snapshot is missing

## 3. Scoping Analysis Fixes

- [ ] 3.1 Update `SimulationListTable.tsx` to use the simulation's linked snapshot for the Significant Location Modal
- [ ] 3.2 Verify Pareto calculation in the modal correctly uses the linked snapshot data

## 4. Verification and Cleanup

- [ ] 4.1 Verify case-insensitive FSLI matching still works correctly across all components
- [ ] 4.2 Perform E2E check: Upload new snapshot, mark active, open old simulation in BPM, verify dropdowns are NOT empty
- [ ] 4.3 Remove debug scripts `debug-db.ts`, `debug-sim.ts`, and `debug-gl.ts`