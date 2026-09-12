## Why

Currently, approval workflows across IndoGRC Pro are fragmented:
- **Scoping, BPM, and Action Plans** use the centralized, interactive `WorkflowPanel.tsx` (which supports multistep state machine transitions, audit history timelines, note dialogs, assignee selection, and the `VITE_ENABLE_WORKFLOW_APPROVAL=false` demo bypass mode).
- **RCM Change Management (Lampiran 6)** and **CSA (Control Self-Assessment)** currently use disparate single-action buttons or custom modal forms without standard workflow history tracking or uniform demo-bypass capabilities.

Standardizing RCM Change Requests and CSA reviews into `WorkflowPanel` provides a consistent user experience for Line 1, Line 2, and Approvers, ensures complete regulatory audit trails, and guarantees that demo bypass mode works reliably across all approval workflows.

## What Changes

- Extend `WORKFLOW_BLUEPRINTS` in `src/components/workflow/WorkflowPanel.tsx` to include blueprints for:
  - `RCM_CHANGE`: Draft -> In Review -> Approved (or Rejected/Rollback)
  - `CSA`: Draft -> In Review -> Validated (or Rejected/Rollback)
- Update `entityType` union in `WorkflowPanel.tsx` and `useWorkflow.ts` to include `'RCM_CHANGE' | 'CSA'`.
- Add backend workflow endpoints:
  - `POST /api/rcm/:id/workflow`
  - `POST /api/csa/:id/workflow`
- Ensure database models for RCM changes and CSA reviews have `workflowStatus` and `workflowHistory` to record actor, timestamp, and notes.
- Replace disparate approval controls in RCM and CSA pages with `WorkflowPanel`.

## Capabilities

### New Capabilities
- workflow/rcm-change-workflow: Standardized multi-stage review and approval lifecycle for RCM / Control change requests with audit trail.
- workflow/csa-review-workflow: Formal Line 1 assessment submission and Line 2 review/validation workflow for Control Self-Assessments.

### Modified Capabilities

## Impact

- **UI Components:** `WorkflowPanel.tsx`, `WorkflowHistoryTimeline.tsx`, RCM change management dialog/views, and CSA worksheet / validation components.
- **Hooks:** `use-workflow.ts`, `use-rcm.ts`, `use-csa.ts`.
- **Backend APIs:** Worker routes `worker/routes/rcm.ts` and `worker/routes/csa.ts`.
- **Database Schema:** Verify/ensure `workflowStatus` and `workflowHistory` fields on relevant tables.
- **Demo Mode:** Bypass mode in `WorkflowPanel` (`VITE_ENABLE_WORKFLOW_APPROVAL=false`) will now also seamlessly finalize RCM Changes and CSA reviews.
