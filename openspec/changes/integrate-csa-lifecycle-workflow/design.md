## Context

The system currently manages ICOFR schedules and results in separate silos. This design establishes a formal link between `csa_schedules` (the plan) and `csa_records` (the result) to enable progress tracking (`In Progress`) and automated status transitions. It also standardizes the "Unsaved Changes" protection across the entire application to prevent data loss in complex audit forms.

## Goals / Non-Goals

**Goals:**
- Implement a two-way synchronization between schedules and assessment records.
- Support multi-stage audit pengerjaan via "Save as Draft" functionality.
- Visualize task urgency in the Todo List using status-based color coding.
- Standardize unsaved changes safety across all data-entry modules.
- Centralize task-related alerts in a global notification bell.

**Non-Goals:**
- Changing the underlying sampling logic or RCM mapping.
- Redesigning the core UI of the calendar grid.
- Implementing an offline-first data sync (online connectivity is assumed).

## Decisions

### 1. Database Schema Linkage
- **Decision**: Add `schedule_id` to the `csa_records` table.
- **Rationale**: This provides a permanent audit trail linking a specific assessment back to its original planned schedule. It allows for "One Schedule -> One Record" (or many if retries are needed) traceability.
- **Alternative**: Implicitly matching by `processId` and `date`. *Rejected* because a process can have multiple schedules (e.g., monthly) and dates can shift, leading to ambiguous links.

### 2. Status State Machine
- **Decision**: Use the following status sequence for `csa_schedules`: `Not Started` -> `In Progress` -> `Completed`.
- **Logic**:
  - `Not Started`: Initial state.
  - `In Progress`: Set automatically when a CSA record is created with `isDraft: true`.
  - `Completed`: Set automatically when a CSA record is finalized (sign-off).

### 3. "Save as Draft" Mechanism
- **Decision**: Introduce a `is_draft` flag in the `POST /api/csa` request body.
- **Backend Behavior**: If `is_draft: true`, bypass biometric verification requirements and mandatory evidence checks. Save the record but do not trigger a "Final" lock.
- **Frontend Behavior**: Maintain the modal state after a draft save, allowing the auditor to continue working without interruption.

### 4. Overdue & Urgency Visualization
- **Decision**: Map CSS classes based on `(status, dueDate)` intersection.
- **Colors**:
  - `Completed`: Green.
  - `In Progress` & `isPast(dueDate)`: Pulsing Red.
  - `Not Started` & `isPast(dueDate)`: Solid Red.
  - `In Progress` & `!isPast(dueDate)`: Yellow/Amber.

### 5. Standardized Safety Guards
- **Decision**: Enforce `UnsavedChangesDialog` and memoized `useUnsavedChanges` hook on all pages listed in the `implement-unsaved-changes-warning` proposal.
- **Implementation**: Wrap main page contents in the dialog and stabilize the router blocker using `useCallback` to prevent infinite loops.

## Risks / Trade-offs

- [Risk] Database lock contention if many auditors save drafts simultaneously. → [Mitigation] Ensure the schedule status update is a lightweight operation.
- [Risk] Orphaned records if a user saves a draft but deletes the schedule. → [Mitigation] Implement cascading deletes or soft-delete protection for linked schedules.
- [Risk] Performance impact of calculating "Overdue" status on large calendars. → [Mitigation] Memoize the status calculation in the `TodoListPage`.
