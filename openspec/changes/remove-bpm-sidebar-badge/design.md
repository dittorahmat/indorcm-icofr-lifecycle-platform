## Context

The navigation sidebar currently includes a badge component `WorkflowPendingBadge` next to the "BPM & CSA" menu item. This badge displays the count of pending workflow tasks. The user finds this badge confusing and wants to remove it from the sidebar layout.

## Goals / Non-Goals

**Goals:**
- Remove the pending badge count from the BPM & CSA link in the sidebar menu.

**Non-Goals:**
- Removing the underlying API endpoint `/api/bpm-processes` or `/api/actionplans` which may be used elsewhere in the codebase.
- Deleting the `WorkflowPendingBadge` component class entirely, unless it is completely unused. (We should keep it or only delete the usage in the sidebar menu rendering).

## Decisions

- **Direct Removal of Component from Sidebar Markup**:
  - We will modify `src/components/app-sidebar.tsx` to remove the `<WorkflowPendingBadge role={userRole} />` from the `/bpm` menu item.
  - Since `WorkflowPendingBadge` is only used inside the sidebar menu, we can clean up any unused state/logic inside `app-sidebar.tsx`.

## Risks / Trade-offs

- None expected. This is a simple UI cleanup.
