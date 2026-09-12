## Context

See proposal.md for motivation. WorkflowPanel.tsx currently supports BPM, ACTION_PLAN, and SCOPING with a configurable blueprint dictionary (WORKFLOW_BLUEPRINTS), an assignee picker, confirmation note dialogs, and a demo bypass toggle (VITE_ENABLE_WORKFLOW_APPROVAL=false). In contrast, RCM Change Management and CSA have ad-hoc review buttons and separate mutation hooks.

## Goals / Non-Goals

**Goals:**
- Unify approval UI in RCM Change Requests and CSA to use WorkflowPanel.tsx.
- Extend WORKFLOW_BLUEPRINTS in WorkflowPanel.tsx to handle RCM_CHANGE and CSA state transitions.
- Standardize the backend workflow API pattern by supporting /api/rcm/:id/workflow and /api/csa/:id/workflow (or adapting existing endpoints).
- Ensure demo bypass works consistently across RCM and CSA workflows.

**Non-Goals:**
- Full replacement of the regulatory digital signature & QR lock mechanism in Management Assessment (Lampiran 11 / Reports Page).
- Changing underlying regulatory rules of SK-5/DKU.MBU/11/2024.

## Decisions

### Decision 1: Blueprint Configuration for New Entities
Add RCM_CHANGE and CSA keys to WORKFLOW_BLUEPRINTS:
- RCM_CHANGE:
  - Draft: Action Submit -> transitions to In Review
  - In Review: Action Reject -> Draft, Action Approve -> Approved
  - Approved: Action Rollback -> In Review
- CSA:
  - Draft: Action Submit -> transitions to In Review
  - In Review: Action Reject -> Draft, Action Approve (labeled "Validate & Sign Off") -> Validated
  - Validated: Action Rollback -> In Review

*Alternative considered:* Separate panels for each entity. Rejected because having one unified component ensures styling consistency and centralizes bypass handling.

### Decision 2: Backend API Integration
Expose dedicated POST /api/rcm/:id/workflow and POST /api/csa/:id/workflow endpoints matching the signature:
{ action: 'Submit' | 'Review' | 'Approve' | 'Reject' | 'Rollback', note?: string, assigneeId?: string }
On approval of RCM change, automatically populate ffectiveDate, invoke existing change log recording, and update master RCM.

### Decision 3: Audit Trail Alignment
Ensure cm and csa tables track workflowStatus and workflowHistory as JSON arrays conforming to WorkflowHistoryEntry[] in shared/types.ts.

## Risks / Trade-offs

- [Risk] Legacy CSA records may lack workflowStatus or workflowHistory.
  -> Mitigation: Default to 'Draft' for incomplete records and 'Validated' for previously signed-off records in API and UI fallback.
- [Risk] Existing single-click approve buttons in RCM might be bypassed.
  -> Mitigation: Gracefully replace direct mutation calls with WorkflowPanel actions and preserve backward compatibility on backend routes.
