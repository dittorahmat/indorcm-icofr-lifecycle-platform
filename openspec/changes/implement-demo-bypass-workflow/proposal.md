## Why

To facilitate demo sessions without the friction of a multi-stage approval process. This allows users to quickly finalize documents (Scoping, BPM, Remediation) without needing to switch between different user accounts (Lini 1, Lini 2, Auditor) to complete the full regulatory workflow.

## What Changes

- Add a demo bypass mechanism to the `WorkflowPanel` component.
- Introduce a new environment variable `VITE_ENABLE_WORKFLOW_APPROVAL` to toggle the bypass mode.
- When `VITE_ENABLE_WORKFLOW_APPROVAL` is set to `'false'`, the `WorkflowPanel` will display a "Bypass Approval" button that instantly triggers the final approval action.
- Add a visual indicator in the UI when the bypass mode is active.

## Capabilities

### New Capabilities
- `demo-bypass-mode`: Ability to bypass the standard multi-stage approval workflow when the application is in demo mode.

### Modified Capabilities
<!-- No existing specs found specifically for the shared workflow approval component. -->

## Impact

- `src/components/workflow/WorkflowPanel.tsx`: Primary modification point for the bypass UI and logic.
- Environment variables: New dependency on `VITE_ENABLE_WORKFLOW_APPROVAL`.
- All pages using `WorkflowPanel` (ScopingPage, BPMPage, RemediationForm) will inherit this behavior.
