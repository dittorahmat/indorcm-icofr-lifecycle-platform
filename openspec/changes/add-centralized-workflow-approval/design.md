## Context

The IndoGRC Pro application currently handles approval workflows and state changes inconsistently across different modules. For example, Scoping has its own simulation status logic (`Draft`, `Pending CFO`, `Approved`), while Deficiencies (`ActionPlanStatus`) have another. A centralized, reusable workflow engine is needed to standardize these processes, providing a consistent UI (a `WorkflowPanel`) and ensuring an immutable audit trail (`WorkflowHistoryEntry`) for actions like Approve, Reject, and Rollback. This design focuses on integrating this engine specifically for BPM Document Approvals and Deficiency/Remediation Action Plans.

## Goals / Non-Goals

**Goals:**
- Design a generic `WorkflowHistoryEntry` schema that can be embedded into multiple entities (BPM processes, action plans).
- Standardize the state machine for BPM Processes (`Draft` -> `Pending Review` -> `Pending Approval` -> `Approved` / `Rejected`).
- Standardize the state machine for Remediation (`Ineffective` -> `In Review` -> `In Approval` -> `Resolved` / `Rejected`).
- Create a highly reusable React component (`WorkflowPanel`) that encapsulates the logic for displaying status, history, and rendering context-aware action buttons with mandatory notes for negative actions.

**Non-Goals:**
- Refactoring the Scoping module's workflow in this initial phase (this will be done later once the core engine is proven in BPM and Remediation).
- Implementing complex, role-based access control (RBAC) matrices within the UI component; the backend will enforce authorization rules.

## Decisions

### 1. Database Schema Updates
Instead of creating a separate, centralized `workflow_history` table that polymorphic-ally links to different entities, we will embed the history directly into the respective entity tables (`bpm_processes` and `action_plans`) using a PostgreSQL `jsonb` column named `workflow_history`.
- *Rationale:* This approach simplifies queries and avoids complex joins when fetching an entity's details. The history is bound strictly to the lifecycle of that specific record.

### 2. State Machine Logic
We will implement two distinct state machines that utilize the same underlying engine:
- **BPM Workflow:** Operates at the Process level (`bpm_processes`). Statuses: `"Draft" | "Pending Review" | "Pending Approval" | "Approved" | "Rejected"`.
- **Remediation Workflow:** Operates at the Control/Action Plan level (`action_plans`). Statuses: `"Ineffective" | "In Review" | "In Approval" | "Resolved"`. Note: `Ineffective` acts as the initial "Draft" state for a remediation plan.

### 3. Reusable `WorkflowPanel` Component
We will build `<WorkflowPanel />` taking generic props such as `entityType`, `entityId`, `currentStatus`, and `history`.
- *Rationale:* This ensures visual consistency. The panel will automatically determine which buttons to show (e.g., "Submit for Review", "Approve", "Reject") based on a configuration map passed to it or internal mapping based on `entityType`. It will inherently enforce the rule that "Reject" and "Rollback" actions require a non-empty `note`.

### 4. API and Mutator Hooks
We will create a generic `useWorkflow` hook that exposes mutation functions to update the status. The backend will expose endpoints (e.g., `/api/bpm/:id/workflow`, `/api/action-plans/:id/workflow`) that validate the state transition, append the new `WorkflowHistoryEntry` to the `jsonb` array, and update the entity's status column atomically.

## Risks / Trade-offs

- **Risk:** Storing history in a `jsonb` column might become large over time for highly contested documents.
  - *Mitigation:* While true, ICOFR documentation lifecycles rarely exceed 10-20 iterations per year. The `jsonb` size remains negligible.
- **Risk:** State transition rules might become fragmented if hardcoded on the frontend.
  - *Mitigation:* The frontend `WorkflowPanel` primarily drives UI (button visibility). The ultimate source of truth for valid state transitions MUST be enforced in the backend API handlers to prevent illegal state changes.
- **Trade-off:** Embedding the workflow directly rather than using a third-party workflow engine (like Camunda or temporal).
  - *Rationale:* A heavy workflow engine is overkill for the relatively linear and predictable approval stages required by SK-5/2024 regulations. A lightweight state machine keeps the application simple and fast (KISS principle).

## Migration Plan
1. Generate Drizzle migrations to add `workflow_status` and `workflow_history` to `bpm_processes` and `action_plans`.
2. Provide a default value for existing records (e.g., setting existing BPMs to `Approved` or `Draft` depending on their current legacy status).
3. Deploy frontend components alongside the API changes.

## Open Questions
- Should "Rollback" be a standard action available to all Approvers, or restricted to Admin/Line 2 only? (Current assumption: Restricted to authorized roles, enforced by backend).
