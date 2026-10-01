## Why

When users navigate to the Deficiency Board (`/deficiencies`) via the sidebar, an unexpected routing crash ("Unexpected Error") is triggered. The error only recovers when clicking "Try Again", which forces a full reload and sets `/deficiencies?year=2026`. Additionally, within the Kanban board, dragging deficiency cards to subsequent statuses fails to drop or move because the column containers lack droppable bounds and status mapping is mismatched between action plan lifecycle statuses and regulatory SK-5 workflow statuses.

Fixing these issues ensures smooth navigation from the sidebar without unhandled routing exceptions, and restores the interactive Drag & Drop Kanban workflow aligned with BUMN SK-5 governance.

## What Changes

- **Navigation & Query Sync Fix**:
  - Update `src/components/app-sidebar.tsx` so navigation links include the current fiscal year parameter (or avoid abrupt location replacement conflicts).
  - Harden `RootLayout.tsx` and `UnsavedChangesGuard.tsx` so automatic query parameter synchronization (`?year=...`) does not trigger navigation blocker loops or unhandled RouteErrorBoundary crashes when navigating cleanly to `/deficiencies`.
- **Kanban Drag-and-Drop Restoration**:
  - Wrap columns with `@dnd-kit/core` `useDroppable` so that dropping onto empty columns or column surface areas is registered accurately.
  - Refactor `handleDragEnd` in `src/pages/deficiencies/DeficiencyBoard.tsx` to handle `workflowStatus` transitions (`Ineffective` -> `In Review` -> `In Approval` -> `Resolved`) through the existing SK-5 workflow endpoint (`/api/actionplans/:id/workflow`), enforcing proper role-based regulatory action triggers.

## Capabilities

### Modified Capabilities
- `remediation-tracking`: Adding interactive Drag-and-Drop Kanban progression requirements aligned with SK-5 deficiency remediation workflow (`Ineffective`, `In Review`, `In Approval`, `Resolved`).
- `unsaved-changes-guard`: Clarifying that automatic background URL query synchronizations (such as adding the active fiscal year parameter) do not block or crash route transitions when the form is not dirty.

## Impact

- `src/components/app-sidebar.tsx`: Route links pass or preserve active `year` query parameter.
- `src/components/layout/RootLayout.tsx`: Safe query sync to prevent race conditions during route transition.
- `src/components/UnsavedChangesGuard.tsx`: Query param diff check only blocks when `isDirty` is actively true and the change is not a benign param sync.
- `src/pages/deficiencies/DeficiencyBoard.tsx`: Added `useDroppable` to `KanbanColumn`, fixed `handleDragEnd` to target `workflowStatus` and trigger SK-5 workflow transitions.
- Unit and integration tests for Deficiency Board and navigation.
