## Why

When the BPM diagram editor is locked (due to period locks, prior year diagrams, or workflow states being submitted/approved), node dragging and the main save button are correctly disabled. However, users can still open the `RegulatoryPropertySheet` and modify fields. Because the diagram is locked, the save button inside the property sheet is disabled, preventing users from saving their changes and leading to confusing "unsaved changes" warnings when closing the sheet.

## What Changes

- Pass the diagram's lock status (`isLocked`) to the `RegulatoryPropertySheet` component.
- Disable all editing inputs (text fields, textareas, selectors, switches) and creation/deletion action buttons inside `RegulatoryPropertySheet` when the diagram is locked.
- Render a clear, user-friendly lock warning banner and indicator at the top of the `RegulatoryPropertySheet` when the diagram is locked, explaining why the sheet is read-only.
- Implement an `onError` handler on the `saveMutation` in `BPMEditor` to display error toasts when a diagram save fails (e.g., due to network or authorization issues), avoiding silent failures.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `unsaved-changes-guard`: The requirements for preventing edits and isDirty state updates when the BPM diagram editor is locked need to be aligned so that read-only mode is enforced consistently.

## Impact

- `src/components/rcm/BPMEditor.tsx` (Propagating lock status, adding error toasts)
- `src/components/rcm/properties/RegulatoryPropertySheet.tsx` (Disabling inputs, displaying lock banner)
