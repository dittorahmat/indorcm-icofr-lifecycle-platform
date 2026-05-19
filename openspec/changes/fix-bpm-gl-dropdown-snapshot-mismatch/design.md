## Context

Currently, the BPM Page and some analysis modals rely on the globally "active" GL Snapshot. However, a `MaterialitySimulation` is a point-in-time calculation based on a specific snapshot. If a user uploads a new snapshot and marks it as active, older simulations opened in the BPM Page will show mismatched data or empty dropdowns because the FSLI/Account names no longer match the current active snapshot's rows.

The `simulations` table already has a `glSnapshotId` column which is mostly populated, but the UI is not yet using it to drive data fetching.

## Goals / Non-Goals

**Goals:**
- Link data fetching in `BPMPage` to the simulation's `glSnapshotId`.
- Link data fetching in `SimulationListTable` analysis modals to the specific simulation's snapshot.
- Provide a standardized hook for resolving the correct snapshot for a simulation.
- Maintain compatibility with legacy simulations where `glSnapshotId` is null.

**Non-Goals:**
- Changing the scoping logic itself.
- Automating the backfill of null `glSnapshotId` values (manual re-scoping is the recommended fix for those).

## Decisions

### 1. Waterfall Data Fetching in BPMPage
**Decision:** Fetch `activeSim` first, then use its `glSnapshotId` to fetch the specific snapshot.
**Rationale:** This ensures data integrity. Although it introduces a small "waterfall" delay, it is necessary because the correct snapshot is dependent on the simulation.
**Alternatives:** 
- Fetching both in parallel and trying to match them client-side. *Problem:* We wouldn't know which snapshot to fetch until we have the simulation data.

### 2. Standardized Hook `useSimulationSnapshot`
**Decision:** Create a hook in `src/hooks/use-bpm.ts` that takes a `glSnapshotId` (optional) and returns the snapshot data, with a fallback to the active snapshot if the ID is missing.
**Rationale:** Centralizes the resolution logic and fallback behavior, making it reusable for `BPMPage` and `SimulationListTable`.

### 3. Fallback Mechanism
**Decision:** If `sim.glSnapshotId` is null, fetch the currently active snapshot via `/api/gl-snapshots-active` logic.
**Rationale:** Preserves functionality for legacy data while allowing new data to be perfectly linked.

## Risks / Trade-offs

- **[Risk]** Waterfall loading delay in BPMPage.
  - **Mitigation:** Use proper loading states (skeletons) to maintain a good UX.
- **[Risk]** Snapshot deletion.
  - **Mitigation:** Ensure the UI handles `notFound` gracefully if a linked snapshot was deleted.
- **[Trade-off]** Performance vs Integrity.
  - **Decision:** Prioritize integrity. Correct data mapping is more critical in an ICOFR platform than a 100ms faster load time.