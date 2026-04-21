## Why

Users are currently unable to delete connections (edges) in the BPM Editor using the standard 'Delete' or 'Backspace' keys. This prevents efficient diagram editing and forces users to leave incorrect or redundant connections in place.

## What Changes

- Enable keyboard-based deletion for both nodes and edges in the BPM Editor.
- Add explicit event handlers for `onNodesDelete` and `onEdgesDelete` to ensure the application state is synchronized and provide visual feedback (toasts).
- Ensure the ReactFlow component correctly captures focus to allow keyboard events to trigger deletions.

## Capabilities

### New Capabilities
- `bpm-editor-interactions`: Standardizes the interaction patterns in the BPM Editor, including deletion, selection, and focus management.

### Modified Capabilities
<!-- No requirement changes to existing capabilities. -->

## Impact

- `src/components/rcm/BPMEditor.tsx`: Implementation of deletion handlers and focus improvements.
