## 1. Sidebar Navigation & Layout Query Synchronization

- [x] 1.1 In `src/components/app-sidebar.tsx`, update links to include `?year=${workingYear}` dynamically or preserve current search params, and verify links contain the fiscal year.
- [x] 1.2 In `src/components/UnsavedChangesGuard.tsx` and `src/components/layout/RootLayout.tsx`, ensure `useBlocker` does not intercept non-dirty route syncs, and verify navigating to `/deficiencies` directly does not trigger `RouteErrorBoundary`.

## 2. Kanban Drag and Drop & Droppable Containers

- [x] 2.1 In `src/pages/deficiencies/DeficiencyBoard.tsx`, add `useDroppable` to `KanbanColumn` and attach `setNodeRef` to the column dropzone container, and verify drop target hover state is registered.
- [x] 2.2 Refactor `handleDragEnd` in `DeficiencyBoard.tsx` to handle `workflowStatus` mapping (`Ineffective`, `In Review`, `In Approval`, `Resolved`), invoke `/api/actionplans/:id/workflow` transition actions, and verify dropping between columns updates status properly.

## 3. Verification & Compliance Mandate

- [x] 3.1 Update and run unit tests in `src/pages/deficiencies/__tests__/DeficiencyBoard.test.tsx` to cover droppable column rendering and drag-drop workflow transitions.
- [x] 3.2 Execute complete quality checks: `npm run type-check`, `npm run lint`, `npm run build`, and `npm test` to verify zero regressions.
