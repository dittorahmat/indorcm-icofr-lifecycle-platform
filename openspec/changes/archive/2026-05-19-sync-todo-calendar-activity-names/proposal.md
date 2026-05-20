## Why

There is a discrepancy between the Todo list (Sidebar) and the Calendar grid in the CSA TodoListPage. The Todo list displays the process name or description, while the Calendar grid is hardcoded to show only the activity type (e.g., "CSA", "TOD"). Users need to input custom activity descriptions (free-text) instead of selecting from a dropdown, and these descriptions must be consistent across all views.

## What Changes

- Replace the "Sub Process" dropdown in the scheduling dialog with a free-text input labeled "Detail Activity".
- Update the data model/form handling to store this free-text description.
- Modify the Calendar grid to display the custom "Detail Activity" description instead of the generic activity type.
- Ensure the Todo sidebar continues to display the specific activity description for consistency.

## Capabilities

### New Capabilities
- `csa-todo-calendar-sync`: Synchronization of custom activity descriptions between Todo list and Calendar views with free-text input support.

### Modified Capabilities
- None

## Impact

- `src/pages/csa/TodoListPage.tsx`: Dialog form and data handling.
- `src/components/csa/TodoListGrid.tsx`: Rendering logic for calendar events.
- `shared/types.ts`: Ensure `CSASchedule` type supports the description properly (already exists but needs consistent usage).
