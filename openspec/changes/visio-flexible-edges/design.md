## Context

See `proposal.md` for motivation. In `src/components/rcm/edges/BridgeEdge.tsx`, edge coordinates are generated via `getOrthogonalPath` which calculates intermediate midpoints and clamps waypoints against a safe ceiling. All edges currently share default routing without individual customization parameters.

## Goals / Non-Goals

**Goals:**
- Provide Visio-like draggable waypoint handle(s) on selected orthogonal edges rendered using React Flow's `EdgeLabelRenderer`.
- Support both 1-corner (L-shape) and 2-corner (Step/Z-shape) orthogonal geometries.
- Allow continuous dragging with coordinate updates and snap-to-axis feedback.
- Save and restore custom waypoint coordinates in `edge.data.bendPointOffset` or `edge.data.waypoints`.
- Support double-click to reset custom waypoints to automatic pathing.

**Non-Goals:**
- Free-form spline / curved bezier lines (regulatory BUMN BPM strictly demands orthogonal 90-degree lines).
- Arbitrary n-vertex polygonal pathing with unconstrained angles (must remain Manhattan orthogonal).

## Decisions

### Decision 1: Use EdgeLabelRenderer for Draggable Waypoint Handles
- **Rationale**: React Flow's `EdgeLabelRenderer` renders HTML components directly over the SVG canvas with proper zoom/pan transformations, avoiding raw SVG drag coordinate pitfalls and keeping event listeners lightweight.
- **Alternatives considered**:
  - Raw SVG circle tags with pointer events: Harder to style, tooltip, and keep visually consistent across browser zoom levels.

### Decision 2: Store Manual Bend Position as `edge.data.bendOffset`
- **Data structure**:
  ```ts
  interface BPMEdgeData {
    bendOffset?: {
      x?: number; // Manual override for vertical segment X
      y?: number; // Manual override for horizontal segment Y
    };
    routingMode?: 'auto' | '1-corner' | '2-corner';
  }
  ```
- **Rationale**: Simple numeric offsets for orthogonal segments are robust against moving connected nodes compared to storing absolute world coordinates (which break when either source or target node is dragged).

### Decision 3: Collision and Clamping Guardrails
- **Rationale**: intermediate waypoints must respect `SAFE_HEADER_CEILING` (100px) so segments do not intersect swimlane headers.

## Risks / Trade-offs

- [Risk] Dragging a waypoint handle could trigger canvas pan/drag instead → Mitigation: Use `event.stopPropagation()` and `nodrag` class on the handle element.
- [Risk] Moving nodes breaks hardcoded waypoints → Mitigation: Use relative delta or clamp coordinates between source and target bounding boxes.
- [Risk] Cluttered canvas with too many handles → Mitigation: Render handle ONLY when `selected === true`.
