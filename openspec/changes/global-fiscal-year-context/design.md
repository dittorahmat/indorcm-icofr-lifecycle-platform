## Context

The application has grown to include multiple year-specific modules, but the time context remains fragmented. Users often have to set the same year on different pages. Additionally, the migration feature needs a robust backend to handle the actual data insertion into production tables.

## Goals / Non-Goals

**Goals:**
- Centralize the "Reporting Year" in a global header selector.
- Synchronize all operational pages (Scoping, BPM, RCM, Migration) with this global state.
- Implement a real backend engine for Smart Migration finalization.
- Maintain a separate "Current Time" context for To-do lists and Notifications.

**Non-Goals:**
- Retrofitting older, inactive modules that don't have a year concept.
- Implementing real-time ERP sync (migration remains batch-based).

## Decisions

### 1. Global State Management (Zustand)
We will use a specialized `useFiscalYearStore` to hold the `workingYear`.
- **Rationale**: Zustand is already used in the project (AI chat store) and is lightweight for global UI state.
- **Persistence**: The year will be mirrored in URL search parameters to ensure the context survives page refreshes and deep links.

### 2. Header Re-layout
Move the year selector from individual pages to `MainHeader.tsx`.
- **UI Design**: A clean, indigo-accented dropdown placed to the left of the notification bell.
- **Range**: Dynamic range `[CurrentYear - 3, CurrentYear + 1]`.

### 3. Backend Migration Realization
Create a dedicated route `worker/routes/migration.ts`.
- **Logic**: When `/api/migration/finalize` is called:
    1. Validate the staging data.
    2. Insert `gl_rows` and create a `gl_snapshot`.
    3. Auto-generate an `Approved` materiality simulation.
    4. Create corresponding `bpm_processes`, `rcms`, and `controls`.
- **Transactionality**: Ensure all insertions happen atomically (if supported by D1/database provider) or include cleanup logic on failure.

### 4. Component Refactoring
Switch `BPMPage.tsx` and `ScopingPage.tsx` from `useState` to `useFiscalYearStore`.
- **Migration Path**: Page-level selectors will be removed. The components will use the `viewYear` from the store and trigger TanStack Query refetches on change.

## Risks / Trade-offs

- **[Risk] Sync Lag** → [Mitigation] Use URL-sync in a single `useEffect` at the layout level to ensure store and URL are always aligned.
- **[Risk] Backend Performance** → [Mitigation] Large migrations will be processed in batches if the record count exceeds 500 rows.
