## Why

Currently, approval workflows in the IndoGRC Pro application are fragmented or hardcoded into specific modules (like Scoping or Deficiency). This creates inconsistent user experiences, duplicates logic, and makes it difficult to maintain a reliable audit trail across different entities (BPM processes, action plans, etc.). Implementing a standardized, centralized workflow engine will provide a unified "Jira-like" approval experience, ensuring that all state transitions (Review, Approve, Reject, Rollback) are handled consistently and securely across the platform, improving governance and making future module integrations much simpler.

## What Changes

- Introduce a unified `WorkflowAction` type and `WorkflowHistoryEntry` interface in `shared/types.ts`.
- Expand and standardize status types for `BPMWorkflowStatus` and `DeficiencyWorkflowStatus`.
- Add `workflow_status` and `workflow_history` fields to the `bpm_processes` and `action_plans` tables via Drizzle schema updates and migrations.
- Create a highly reusable, configuration-driven `WorkflowPanel` React component. It uses a `WORKFLOW_BLUEPRINTS` object to map statuses to available actions, making it instantly extensible to new modules (e.g., Scoping) without changing the core component logic.
- Implement mandatory notes validation for `Reject` and `Rollback` actions within the `WorkflowPanel`.
- Integrate the `ApprovalHistoryTimeline` directly into the `WorkflowPanel` for a consolidated view of the entity's audit trail.
- Update `BPMPage.tsx` and related RCM editors to utilize the new `WorkflowPanel` and enforce read-only states when a BPM process is not in a `Draft` or `Rejected` state.
- Implement the `useUnsavedChanges` pattern within the `WorkflowPanel` and associated forms to prevent accidental data loss during state transitions.
- Integrate assignee selection during forward state transitions (e.g., Submit for Review, Approve to next level) so users can specifically assign a reviewer/approver.
- Update backend services to capture the `assigneeId` and route notifications directly to the assigned user.
- Integrate critical workflow notifications (e.g., "Pending Approval") into the global `NotificationBell`.
- Ensure the `WorkflowPanel` is accessible and linked from relevant sidebar/navigation contexts where necessary.
- Update `RemediationForm.tsx` and `DeficiencyBoard.tsx` to handle the multi-stage remediation workflow (Ineffective -> In Review -> In Approval -> Resolved) using the `WorkflowPanel`.
- Build custom hooks (`useWorkflow`) to centralize API calls for state mutations and history fetching.

## Capabilities

### New Capabilities
- `centralized-workflow`: A standardized, entity-agnostic workflow engine supporting Draft, Review, Approval, Reject, and Rollback states with integrated history tracking and UI locking mechanisms.

### Modified Capabilities

## Impact

- **Database:** Requires schema changes to `bpm_processes` and `action_plans` tables, necessitating a Drizzle migration. Existing data may need a fallback or initialization script to set default statuses.
- **Frontend Components:** Significant updates to `BPMPage`, `RCMEditDialog`, `DeficiencyBoard`, and `RemediationForm` to integrate the new side-panel and state locking logic.
- **API:** New or updated endpoints (`/api/workflow/action`, etc.) to handle the standardized state transitions and append history entries securely.
- **Shared Types:** Broad impact on type definitions (`shared/types.ts`), which will affect compilation across the entire stack.
