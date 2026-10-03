## 1. Edge Data Types & Path Routing Engine

- [x] 1.1 Update edge data typing in `shared/types.ts` and `BridgeEdge.tsx` to include optional `bendOffset` ({ x?: number; y?: number }) and `routingMode` ('auto' | '1-corner' | '2-corner'). Verify type-check passes.
- [x] 1.2 Refactor `getOrthogonalPath` in `BridgeEdge.tsx` to accept manual `bendOffset` and support clean 1-corner (L-shape) routing when aligned or requested. Verify unit tests for orthogonal calculations.

## 2. Interactive Visio-Style Waypoint Controls

- [x] 2.1 Implement draggable waypoint control handle using `EdgeLabelRenderer` in `BridgeEdge.tsx` with grab/resize cursor, active hover feedback, and `nodrag` class protection against canvas dragging. Verify visual render on selected edge.
- [x] 2.2 Wire drag event handlers to calculate delta coordinates relative to React Flow canvas scale, updating edge data in real time. Verify smooth dragging without stutter.
- [x] 2.3 Implement double-click reset on waypoint handle to restore automatic pathing. Verify double-click clears `bendOffset`.

## 3. Persistence, Undo/Redo & Serialization

- [x] 3.1 Ensure waypoint modifications trigger `setDirty(true)` and push canvas state to `useCanvasHistory` so Undo/Redo restores previous bend positions. Verify undoing edge drag reverts position.
- [x] 3.2 Update `sanitizeEdgesForSave` to retain `bendOffset` and `routingMode` so custom waypoints persist across diagram saves and reloads. Verify diagram export and reload.

## 4. Verification & Testing

- [x] 4.1 Create automated tests for single-corner vs step-bend routing and waypoint drag updates. Verify tests pass with `npm test`.
- [x] 4.2 Run complete Mandat Penyelesaian Tahap validation (`type-check`, `lint`, `test`, `build`). Verify all checks pass cleanly.
