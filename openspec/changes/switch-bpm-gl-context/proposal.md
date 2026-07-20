## Why

Currently, when a BPM diagram is associated with multiple GL codes, the user cannot easily navigate between the contexts of those linked GL codes from within the BPM Editor. Furthermore, there is no distinct separation between managing the linked GL associations (via checkboxes) and switching the editor's active context to one of the linked GLs. Enabling seamless context switching and syncing it to the parent BPM Page upon closing the editor improves usability and workflow efficiency.

## What Changes

- Add a distinct "Switch Context" navigation list/interface in the `BPMEditor` Linked GLs popover, separating context navigation from the association checkboxes.
- Allow clicking an associated GL code to switch the active `BPMEditor` view to that GL's context (triggers reloading of the diagram nodes/RCM data specific to that GL).
- Automatically synchronize the active GL context to the URL search parameters (`noGL` and `glDesc`) when switching GLs inside the editor.
- Update the parent `BPMPage` to reflect the switched GL context on closing the editor modal, so that the main process list aligns with the last viewed GL context.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `bpm-execution-hub`: Update diagram navigation and context switching rules within the BPM Editor and parent workspace.

## Impact

- Frontend:
  - `src/components/rcm/BPMEditor.tsx` (Linked GL Popover UI, state, search parameters sync)
  - `src/pages/bpm/hooks/useBPMPage.ts` (Synchronization of search parameter changes upon closing/navigating)
- APIs:
  - None (API routes already support retrieving diagrams and filtering by `noGL` query parameters).
