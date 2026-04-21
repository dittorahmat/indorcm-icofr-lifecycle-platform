## Why

Currently, connections between nodes in the BPM Editor are simple lines without directional indicators. This makes it difficult for users to intuitively follow the business process flow, especially in complex diagrams. Adding directional arrows ensures clarity and alignment with standard BPM mapping conventions.

## What Changes

- Add directional arrows to all edges in the BPM Editor.
- Ensure new connections created by users automatically include arrows pointing from source to target.
- Update the BPM Viewer modal to display arrows for existing diagrams.
- Use the `ArrowClosed` marker style for a professional, standardized appearance.

## Capabilities

### New Capabilities
- `bpm-edge-visuals`: Standardizes the visual representation of connections in BPM diagrams, specifically adding directional markers to edges.

### Modified Capabilities
<!-- No requirement changes to existing capabilities, this is a visual enhancement to the BPM component. -->

## Impact

- `src/components/rcm/BPMEditor.tsx`: Update `onConnect` and edge hydration logic.
- `src/components/rcm/CSAViewerModal.tsx`: Update edge hydration logic.
- `reactflow`: Utilization of `MarkerType` for edge styling.
