## 1. Bridge Edge Component

- [x] 1.1 Create `BridgeEdge.tsx` component in `src/components/rcm/edges/BridgeEdge.tsx` to handle custom path parsing and intersection detection.
- [x] 1.2 Implement geometrical line segment intersection logic to identify where horizontal and vertical lines cross.
- [x] 1.3 Add SVG path modification logic to draw semi-circular arcs (bridges) at intersection coordinates.

## 2. BPM Editor Integration

- [x] 2.1 Register the new `BridgeEdge` component as the `bridge` edge type in `BPMEditor.tsx` using React Flow's `edgeTypes`.
- [x] 2.2 Update `onConnect` handler in `BPMEditor.tsx` to apply `type: 'bridge'` to newly created edges.
- [x] 2.3 Ensure loaded diagrams map standard edges to the `bridge` type to enable line jumps retroactively.
