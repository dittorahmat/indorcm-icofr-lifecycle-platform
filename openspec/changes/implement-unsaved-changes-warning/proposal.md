## Why

Users have reported losing data when accidentally navigating away from pages like Scoping or BPM Editor without saving their changes. Additionally, the Scoping module currently uses a fragmented, hardcoded approval system that lacks the consistency, auditability, and safety features (like mandatory notes for rejection) provided by the centralized `WorkflowPanel`. This change will unify the Scoping approval process with the rest of the application, ensure data integrity via the "double-layer" unsaved changes warning, and synchronize the infrastructure for production readiness.

## What Changes

- **Centralized Scoping Workflow**: Integrate the `WorkflowPanel` into the Scoping module. This requires updating the `MaterialitySimulation` model to support standardized `workflowStatus` and `workflowHistory` fields.
- **Internal Navigation Guard**: Implementation of a React Router `useBlocker` mechanism to intercept internal route changes and show the `UnsavedChangesDialog`.
- **External Navigation Guard**: Implementation of a `beforeunload` event listener to catch browser-level events (tab close, refresh).
- **Global `useUnsavedChanges` Hook**: Refine and standardize the usage of the safety hook across all critical editors.
- **Database Schema Sync**: Update the `simulations` table schema and run Drizzle migrations to support the new workflow fields.
- **Localization**: Full localization of the Workflow and Unsaved Changes UI in `src/i18n/`.
- **Navigation & Feedback**: Integrate the Scoping lifecycle into the Notification Bell and ensure the Sidebar reflects current workflow states if necessary.
- **Code Hygiene**: Refactor the Scoping editor to remove hardcoded approval buttons and apply SOLID principles.

## Capabilities

### New Capabilities
- `unsaved-changes-guard`: Data loss prevention mechanism for all high-stakes editors.
- `centralized-scoping-workflow`: Standardized approval flow for Materiality Simulations.

### Modified Capabilities
- `scoping-management`: Now fully integrated with the centralized workflow engine and protected by navigation guards.

## Impact

- `src/pages/scoping/ScopingPage.tsx`: Primary integration point for `WorkflowPanel` and `useUnsavedChanges`.
- `src/pages/scoping/components/ScopingEditorHeader.tsx`: Refactored to remove old approval logic.
- `shared/types.ts`: Updated `MaterialitySimulation` interface.
- `drizzle/schema.ts`: Updated `simulations` table definition.
- `src/hooks/useUnsavedChanges.ts`: Core safety logic.
- `src/components/workflow/WorkflowPanel.tsx`: Used in Scoping.
