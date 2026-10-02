## 1. Schema & Backend Preparation

- [x] 1.1 Extend Simulation and Control status enums to support `Pending Deletion Approval` and `Pending Update Approval`, and verify types compile via `npm run type-check`.
- [x] 1.2 Implement deletion request endpoint `POST /api/simulations/:id/request-deletion` and `POST /api/controls/:id/request-deletion` in Hono backend routes.
- [x] 1.3 Add backend guard in `DELETE /api/simulations/:id` and `DELETE /api/controls/:id` to reject direct deletion of `Approved` items unless caller has bypass permissions or status is already marked for deletion approval.
- [x] 1.4 Implement approval and rejection handlers for deletion requests that update regulatory audit trail logs (Lampiran 6).

## 2. Frontend Dialog Standardization (Eliminate Raw Confirms)

- [x] 2.1 Replace raw `window.confirm` calls in `src/pages/csa/TodoListPage.tsx` with `useConfirm()` dialogs.
- [x] 2.2 Replace raw `window.confirm` calls in `src/components/rcm/ITGCEvidenceLibrary.tsx` with `useConfirm()` dialogs.
- [x] 2.3 Audit and replace any remaining `window.confirm` in `src/components/scoping/SmartImportWizard.tsx` and `src/components/layout/FiscalYearSelector.tsx`.

## 3. UI Workflow Integration & Action Buttons

- [x] 3.1 Update Scoping Simulation table and detail actions: render "Request Deletion" for `Approved` items and direct "Delete" (with `useConfirm`) for unapproved drafts.
- [x] 3.2 Update Control table action menus in RCM: render "Request Deletion" or "Request Change" when in `Approved` state.
- [x] 3.3 Expand the Approval Page / Queue (`src/pages/scoping/ApprovalPage.tsx`) to surface pending deletion and update requests with approver action buttons.

## 4. Verification & Testing

- [x] 4.1 Add automated test verifying that deleting an approved simulation transitions status to `Pending Deletion Approval` without database purge.
- [x] 4.2 Add automated test verifying that deleting with workflow disabled prompts `useConfirm` modal before deletion API dispatch.
- [x] 4.3 Run full verification suite (`type-check`, `lint`, `test`, `build`) to ensure complete compliance.
