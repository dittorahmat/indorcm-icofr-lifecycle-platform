## 1. Database and Types

- [x] 1.1 Update `shared/types.ts` to include `WorkflowAction`, `WorkflowHistoryEntry`, `BPMWorkflowStatus`, and `DeficiencyWorkflowStatus`.
- [x] 1.2 Update `worker/db/schema.ts` to add `workflowStatus` and `workflowHistory` to the `bpmProcesses` table.
- [x] 1.3 Update `worker/db/schema.ts` to add `workflowStatus` and `workflowHistory` to the `actionPlans` table.
- [x] 1.4 Generate and apply Drizzle migrations using `npx drizzle-kit push`.

## 2. API Endpoints and Hooks

- [x] 2.1 Create a new API route/handler (`worker/src/routes/workflow.ts` or similar) to handle status updates and history appends for BPM processes.
- [x] 2.2 Create a new API route/handler for Remediation action plans status updates and history appends.
- [x] 2.3 Implement the `useWorkflow` custom hook to centralize the API calls (fetch history, mutate status) on the frontend.
- [x] 2.4 Integrate workflow actions with the existing Notification system to trigger bell alerts.

## 3. UI Components and Localization

- [x] 3.1 Extract and adapt the `ApprovalHistoryTimeline` component to ensure it can display generic `WorkflowHistoryEntry` data.
- [x] 3.2 Create the new reusable `<WorkflowPanel />` component that accepts generic props (`entityType`, `status`, `history`, `onAction`).
- [x] 3.3 Implement the UI logic inside `<WorkflowPanel />` to show appropriate buttons (Submit, Review, Approve, Reject, Rollback) based on status.
- [x] 3.4 Implement the mandatory notes validation modal/form for "Reject" and "Rollback" actions within `<WorkflowPanel />`.
- [x] 3.5 Add all new UI strings to `src/i18n/locales/en/*.json` and `src/i18n/locales/id/*.json`.
- [x] 3.6 Implement the `useUnsavedChanges` hook in `WorkflowPanel` to prevent data loss during transitions.

## 4. Module Integration and Sidebar

- [x] 4.1 Integrate `<WorkflowPanel />` into `src/pages/bpm/BPMPage.tsx` and map actions to the BPM API endpoint.
- [x] 4.2 Implement form locking (read-only mode) in the BPM Editor when the status is not `Draft` or `Rejected`.
- [x] 4.3 Integrate `<WorkflowPanel />` into `src/components/deficiencies/RemediationForm.tsx` (and/or `DeficiencyBoard.tsx`).
- [x] 4.4 Implement form locking for action plans when the status is not `Ineffective`.
- [x] 4.5 Ensure workflow-related navigation is updated in the sidebar if required.

## 5. Testing and Validation

- [x] 5.1 Run `npm run type-check` to verify the expanded types across the application.
- [x] 5.2 Run `npm run lint` and `npm run build` to ensure no build errors are introduced.
- [x] 5.3 Test the full BPM workflow cycle locally (Draft -> Review -> Approve -> Rollback).
- [x] 5.4 Test the full Remediation workflow cycle locally (Ineffective -> Review -> Reject -> Ineffective -> Review -> Approve -> Resolved).
