## Why

User feedback indicates that the current directional arrows on BPM edges are too small and the connection lines are too faint. This reduces the clarity of the process flow, especially on complex diagrams or when viewed on different screens.

## What Changes

- Increase the size of the `ArrowClosed` markers (width/height from default to 20px).
- Darken the edge line color to `slate-800` (#1e293b) for better contrast.
- Increase the edge line thickness slightly (strokeWidth: 2).
- Ensure consistent coloring between the line and the arrow head.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `bpm-edge-visuals`: Refine the visual specifications for connection markers and lines.

## Impact

- `src/components/rcm/BPMEditor.tsx`: Update `onConnect` and edge hydration.
- `src/components/rcm/CSAViewerModal.tsx`: Update edge hydration.
