## Context

See proposal.md for motivation and background.
Currently:
1. `RootLayout.tsx` synchronizes `workingYear` to URL query parameters via `setSearchParams(..., { replace: true })`. If a user arrives at a bare URL like `/deficiencies`, this query parameter update runs during or right after layout mount. If caught by `UnsavedChangesGuard`'s `useBlocker` or React Router v7 re-render mechanics, it triggers `RouteErrorBoundary`.
2. `DeficiencyBoard.tsx` groups action plans by `workflowStatus || status`, but `KanbanColumn` does not call `useDroppable` from `@dnd-kit/core`. Also, `handleDragEnd` tries to update `status` rather than `workflowStatus`, and does so by calling standard action plan updates instead of the SK-5 workflow state machine (`/api/actionplans/:id/workflow`).

## Goals / Non-Goals

**Goals:**
- Eliminate route crashes when navigating from sidebar or directly to `/deficiencies`.
- Enable seamless Drag-and-Drop between Kanban columns in `DeficiencyBoard` by adding `useDroppable` to each column.
- Map dropped cards to the appropriate SK-5 regulatory workflow action (`Submit`, `Review`, `Approve`, `Reject`) or update `workflowStatus` appropriately.
- Ensure minimum 12px institutional typography and enterprise styling are preserved without regressions.

**Non-Goals:**
- Modifying backend database schema (both `actionPlans` and `deficiencies` tables already support `workflowStatus` and the workflow endpoint).
- Altering user role permissions beyond what is established in SK-5/DKU.MBU/11/2024.

## Decisions

### Decision 1: Consistent Year Navigation from Sidebar & Resilient RootLayout
- **Choice**:
  1. In `src/components/app-sidebar.tsx`, use `to={`/deficiencies?year=${workingYear}`}` (or preserve query parameter via active store state).
  2. In `src/components/UnsavedChangesGuard.tsx`, ensure `useBlocker` only intercepts if `isDirty` is strictly true. When `isDirty` is false, `blockerCallback` returns false immediately, preventing benign query param synchronization from triggering blocker state.
- **Alternatives Considered**: Removing query params altogether. Rejected because multi-year audit compliance is a core BUMN regulation requirement.

### Decision 2: Add `useDroppable` to `KanbanColumn`
- **Choice**:
  In `KanbanColumn`, invoke `const { setNodeRef, isOver } = useDroppable({ id: status })` and attach `setNodeRef` to the column drop container.
- **Rationale**: `@dnd-kit` requires droppable containers for items to be dropped onto empty columns or the column surface itself.

### Decision 3: Transition via SK-5 Workflow or Direct Workflow Status
- **Choice**:
  In `handleDragEnd`, calculate the target column (`overContainerId`). When moving forward (e.g. `Ineffective` -> `In Review`), trigger `workflowMutation` with `action: 'Submit'`; when moving `In Review` -> `In Approval`, trigger `action: 'Review'`; when moving `In Approval` -> `Resolved`, trigger `action: 'Approve'`. If user is Admin or has appropriate permission, execute the transition seamlessly.
- **Alternatives Considered**: Modifying arbitrary statuses directly via `PUT /api/actionplans/:id`. Rejected because SK-5 audits require an immutable `workflowHistory` entry created by `/api/actionplans/:id/workflow`.

## Risks / Trade-offs

- **[Risk] Dragging backwards or skipping stages**: Dropping from `Resolved` to `Ineffective` requires a rollback note in SK-5.
  → *Mitigation*: If an invalid or backwards transition is dragged (e.g., non-admin attempting unapproved rollback), display an informative toast error and revert card position optimistically.
