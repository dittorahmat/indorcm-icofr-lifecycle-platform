## Why

When multiple process flow lines (edges) cross each other in the BPM Editor, they currently overlap directly forming an 'X' shape. This makes the diagram difficult to read and can mistakenly imply a logical intersection or connection. Implementing a visual crossover bridge (line jump) improves diagram clarity by showing that intersecting lines do not connect.

## What Changes

- Introduce a custom React Flow edge (`BridgeEdge` or similar) that automatically detects intersections with other edges.
- Where horizontal and vertical lines cross, draw a visual semi-circular bridge/lengkungan (crossover arc) on one of the lines to indicate they are crossing without connecting.
- Set the custom bridge edge as the default edge type in `BPMEditor.tsx`.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `bpm-edge-visuals`: Add requirements for rendering crossover bridges (line jumps) when two edges intersect, enhancing readability and preventing visual confusion.

## Impact

- `src/components/rcm/BPMEditor.tsx` and node/edge rendering components.
- React Flow edge layout and styling logic.
