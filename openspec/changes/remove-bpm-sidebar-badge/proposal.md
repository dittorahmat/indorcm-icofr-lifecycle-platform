## Why

The sidebar link for BPM (labeled "BPM & CSA" in the UI) currently displays a pending badge showing the sum of pending workflows. Users find this notification-like badge confusing as it is capped (mentok) or not aligning with their expectations of notifications, and they prefer to remove it to simplify the interface.

## What Changes

- Remove the `WorkflowPendingBadge` component from the sidebar menu item for BPM in `src/components/app-sidebar.tsx`.
- Keep the actual query and types if they are used elsewhere, but clean up unused imports or variables in `src/components/app-sidebar.tsx` if any.

## Capabilities

### New Capabilities
- `sidebar-workflow-badge`: This capability covers the removal of workflow pending counts from navigation sidebar links to ensure clean aesthetics and reduce cognitive load.

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing -->

## Impact

- `src/components/app-sidebar.tsx`: The workflow pending badge will no longer be rendered on the BPM menu item.
