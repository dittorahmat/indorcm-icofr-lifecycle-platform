## Context

The BPM Editor implements a hierarchical visualization where Risks and Controls are "docked" as child nodes to an Activity node. The current implementation suffers from:
1. A runtime crash when `getEnrichedControlData` is called before `controlsData` (fetched via TanStack Query) is available.
2. A race condition where adding a control updates the parent node but fails to create the badge node because the state update is split across two `setNodes` calls.

## Goals / Non-Goals

**Goals:**
- Eliminate `TypeError` when master data is in a loading state.
- Ensure control badges appear instantly upon creation/linkage.
- Maintain the "Top-Docked" visual style (`y: -12`) for all badges.

**Non-Goals:**
- Changing the data model for RCM or Controls.
- Refactoring the entire docking system into a single custom node (keeping the React Flow parent-child structure).

## Decisions

### 1. Null-Safe Data Enrichment
We will wrap the `controlsData` access in `getEnrichedControlData` with null checks.
- **Rationale**: Prevent the entire editor from crashing during initial load or refresh.
- **Alternative**: Checking for loading state before rendering the component, but this is less robust for incremental updates.

### 2. Atomic State Reconciliation
We will refactor `linkControlToRisk` to perform all node calculations (updating activity data AND creating/updating badge nodes) within a single `setNodes` callback.
- **Rationale**: React state updates are batched, but split `setNodes` calls can still lead to the second call operating on "stale" state from the first closure. Using a single callback ensures consistency.

### 3. Fixed Vertical Positioning
We will strictly use `y: -12` for both `docked-risk` and `docked-control` nodes.
- **Rationale**: User preference is for top-docking. This avoids ambiguity and "floating" badges.

## Risks / Trade-offs

- **[Risk]** Large diagrams might still have minor state synchronization delays. → **Mitigation**: Use `useMemo` for derived data (already in place).
- **[Risk]** Positional overlap if too many badges are docked. → **Mitigation**: Standard docking is currently limited to one Risk group and one Control group badge.
