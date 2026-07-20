## Context

Currently, a BPM diagram can be associated with multiple GL codes. These relationships are stored in the `bpm_process_gl_codes` junction table. In the frontend, the `BPMEditor` displays the number of linked GL codes, and clicking it opens a popover containing a `MultiSelect` component to manage associations. However, there is no way for a user to switch the active view to another associated GL code to check its specific RCM details, and closing the editor always drops the user back into the original GL code list.

## Goals / Non-Goals

**Goals:**
- Separate the UI for managing GL associations (checkboxes) from navigating GL contexts (clickable links).
- Update the URL search parameters (`noGL`, `glDesc`) dynamically when switching the editor's active context.
- Ensure that closing the `BPMEditor` modal updates the parent `BPMPage` process list to display the last-selected GL code context.
- Guard against data loss by prompting the user if they try to switch contexts with unsaved changes.

**Non-Goals:**
- Changing database schema or backend APIs.
- Modifying how RCM risks or controls are mapped.

## Decisions

### Decision 1: Distinct Navigation and Association Sections in Popover
We will split the popover into two distinct visual areas:
1. **"Switch Context"**: A list of clickable buttons/badges for each associated GL code. Clicking one will update the active editor context.
2. **"Manage Link GL Codes"**: The existing `MultiSelect` search box and checkboxes to modify database relationships.

### Decision 2: Sync Context via Search Parameters
Instead of passing callbacks up to the parent page, the `BPMEditor` and parent components will sync the active GL context directly via URL search parameters using `useSearchParams`.
- When switching GL context in `BPMEditor`:
  1. If `isDirty` is true, prompt the user for confirmation.
  2. If confirmed, set `noGL` and `glDesc` in the URL parameters.
  3. The `BPMEditor` queries (which depend on `currentGL` or URL params) will automatically refetch the new context data.
- When closing the editor:
  1. The parent `BPMPage` closes the dialog but leaves `noGL` and `glDesc` unchanged in the search parameters.
  2. The parent list page naturally renders the process list for the switched GL.

## Risks / Trade-offs

- **Risk**: Loss of unsaved diagram edits when switching GL contexts.
  - *Mitigation*: Reuse the `UnSavedChanges` hook check or show a window confirm/alert if `isDirty` is true before updating search parameters.
