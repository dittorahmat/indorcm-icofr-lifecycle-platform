## Context

In `src/pages/scoping/hooks/useScopingPage.ts`, the hook `useScopingEditor` manages the state of a materiality scoping simulation.
Currently, three primary states are updated in React effects that synchronize from the query data `initialSimulation` or related queries:
1. `simState` (which contains `assessmentData`)
2. `localDeptMappings`
3. `localAppMappings`

Because the `useEffect` hooks run unconditionally on any reference change to `initialSimulation` or `initialMappings`, background query refetches trigger state synchronization, overwriting the user's unsaved local changes and causing data loss.

## Goals / Non-Goals

**Goals:**
- Guard the state-sync effects to only sync when the simulation ID changes or when there are no unsaved changes (`isDirty === false`).
- Preserve background data refresh when the page is clean, but freeze it while the page has pending changes.

**Non-Goals:**
- Altering the backend API endpoints or the database schema.
- Changing the UI components themselves.

## Decisions

### Decision 1: Guard state sync logic using `isDirty` and simulation ID ref tracking
- **Option A (Chosen)**: Use a `useRef` to track `initialSimulation.id`. Sync states if the simulation ID changes (switching simulations) or if `isDirty` is false.
  - *Rationale*: Safe, robust, and correctly scopes updates based on the user's intent. Prevents overwriting local edits.
- **Option B**: Disable React Query auto-refetch/background queries on this page.
  - *Rationale*: Poor UX because other parts of the dashboard (like the workflows, statuses) will not refresh in the background.

## Risks / Trade-offs

- **Risk**: Out-of-sync indicators if another user modifies the same simulation in the background while this user has a dirty form.
  - *Mitigation*: The user has an unsaved changes indicator, and saving will overwrite or alert. This is acceptable for simple scoping scenarios.
