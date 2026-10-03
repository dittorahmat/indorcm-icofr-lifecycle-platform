## Why

In complex business process mapping (BPM) under BUMN regulation SK-5/DKU.MBU/11/2024, users frequently need clean, professional orthogonal routing for connectors between activities, decisions, and documents. Currently, `BridgeEdge` computes fixed mid-channel step routing that produces two or three right angles (2-bend step/S-curves) and does not allow users to create single-corner (1-bend L-shape) connectors or customize waypoint positions. Users accustomed to Microsoft Visio expect interactive waypoint control handles on selected connectors to adjust corner placement, convert 2-corner connectors into 1-corner connectors, and manually route around obstacles.

## What Changes

- **Interactive Waypoint/Segment Control Handles (Visio-Style)**: When an edge is selected, interactive handle(s) appear on intermediate orthogonal segments or corners allowing users to drag and reposition the bend coordinates directly on canvas.
- **Single-Corner (L-Shape) Support**: Edges can be configured or dragged into a clean 1-corner orthogonal connector (horizontal-then-vertical or vertical-then-horizontal), snapping directly to the aligned axis.
- **Waypoint Persistence & History**: Manual waypoint offsets (`bendPoints` or `midOffset`) are stored in edge data, persisted across diagram saves, and tracked in `useCanvasHistory` for Undo/Redo support.
- **Double-Click Reset**: Double-clicking a waypoint control handle resets the edge routing to default automatic orthogonal calculation.

## Capabilities

### Modified Capabilities
- `bpm-edge-visuals`: Add interactive Visio-style waypoint dragging, 1-corner L-shape routing, and segment adjustment handles for selected BPM connectors.

## Impact

- Affected files:
  - `src/components/rcm/edges/BridgeEdge.tsx`: Implement segment control handles via `EdgeLabelRenderer`, integrate draggable waypoint logic, and support 1-corner (L-shape) routing.
  - `src/components/rcm/editor/hooks/useBPMCanvasHandlers.ts` and `src/components/rcm/BPMEditor.tsx`: Ensure edge updates trigger dirty state, canvas history push, and proper serialization in `sanitizeEdgesForSave`.
  - `shared/types.ts` / edge data interfaces: Formalize edge bend point data contract.
