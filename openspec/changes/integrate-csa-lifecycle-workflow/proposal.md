## Why

The current ICOFR lifecycle platform has a gap between "Planning" (scheduling) and "Execution" (CSA assessment). Auditors often work in stages, gathering evidence over time, but the system only supports a one-time "Sign-off" which closes the task immediately. This proposal bridges that gap by introducing a "Save as Draft" mechanism and a synchronized state machine between schedules and records, ensuring real-time visibility into the "In Progress" status of audit tasks.

## What Changes

- **Synchronized State Machine**: Links `csa_schedules` and `csa_records` using a shared `scheduleId`.
- **"Save as Draft" Capability**: New UI/API path in `CSATabContent` to save progress without full biometric sign-off.
- **Dynamic Status Transitions**:
  - `Not Started` -> `In Progress` (on first draft save).
  - `In Progress` -> `Completed` (on final sign-off).
- **Overdue Visual Cues**: Enhanced coloring in `TodoListPage` to highlight tasks that are past their deadline or reminder threshold (Red for late, Yellow for started).
- **Direct Execution Linking**: Automatically directs the user from a Todo List task to the specific relevant tab (e.g., "CSA Assessment") in the Execution Hub.
- **Unsaved Changes standardisation**: Enforce the `UnsavedChangesDialog` and `useUnsavedChanges` hook across all data-entry forms as previously proposed.
- **Localization Update**: Ensure all new status strings and UI elements are translated in `@src/i18n/`.
- **Notification Bell Integration**: Surface overdue and upcoming task alerts in the header notification bell.

## Capabilities

### New Capabilities
- `csa-draft-management`: The ability to save, retrieve, and track the progress of incomplete CSA assessments.

### Modified Capabilities
- `csa-management`: Update to include `scheduleId` linkage and status synchronization with the calendar.
- `icofr-ritual-scheduling`: Update status logic to include `In Progress` and enhanced overdue reporting.
- `compliance-notification-system`: Integrate specific task alerts for upcoming and overdue ICOFR activities.

## Impact

- `worker/db/schema.ts`: Add `scheduleId` to `csa_records`.
- `worker/user-routes.ts`: Update `POST /api/csa` to handle draft saving and schedule status updates.
- `src/components/bpm/CSATabContent.tsx`: Add "Save as Draft" button and props for `scheduleId`.
- `src/pages/csa/TodoListPage.tsx`: Inject `scheduleId` into Hub opening logic and enhance calendar coloring.
- `src/i18n/`: New keys for `status.started`, `common.actions.saveDraft`, etc.
- `src/components/layout/Header.tsx`: Integration with the notification bell for task alerts.
