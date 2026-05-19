## 1. Database & Schema Alignment

- [x] 1.1 Update `drizzle/schema.ts` to add `workflowStatus` and `workflowHistory` to the `simulations` table.
- [x] 1.2 Update `shared/types.ts` for `MaterialitySimulation` to include the new workflow fields.
- [x] 1.3 Generate and run Drizzle migration (`npx drizzle-kit push`) to synchronize the database.
- [x] 1.4 Backfill existing simulations with default 'Draft' status and empty history if necessary.

## 2. Centralized Workflow Integration (Scoping)

- [x] 2.1 Integrate `WorkflowPanel` into `ScopingPage.tsx` (suggested as a side-panel like in BPMPage).
- [x] 2.2 Update `useScopingEditor` hook to handle the new workflow status mutations via `useWorkflow`.
- [x] 2.3 Refactor `ScopingEditorHeader.tsx` to remove old hardcoded `Submit` buttons.
- [x] 2.4 Ensure the `isLocked` logic in Scoping is fully driven by the `workflowStatus`.

## 3. Data Integrity (Unsaved Changes)

- [x] 3.1 Verify `src/hooks/useUnsavedChanges.ts` and `src/components/ui/UnsavedChangesDialog.tsx` existence.
- [x] 3.2 Refine `useUnsavedChanges.ts` for consistent behavior across all browsers.
- [x] 3.3 Apply `useUnsavedChanges` and `UnsavedChangesDialog` to `ScopingPage.tsx`.
- [x] 3.4 Integrate `isDirty` tracking with the `WorkflowPanel` so actions are blocked if there are unsaved changes.

## 4. UI, Localization & Feedback

- [x] 4.1 Implement full localization for Scoping workflow actions in `src/i18n/locales/`.
- [x] 4.2 Update Notification Bell to include "Scoping Pending Approval" lifecycle events.
- [x] 4.3 Audit and refactor Scoping components for code hygiene (SOLID, DRY).

## 5. Verification & TDD

- [x] 5.1 Create automated test for Scoping workflow state transitions.
- [x] 5.2 Verify that the `UnsavedChangesDialog` correctly blocks navigation on dirty scoping data.
- [x] 5.3 Run full project verification: `npm run type-check`, `npm run lint`, `npm test`, `npm run build`.
