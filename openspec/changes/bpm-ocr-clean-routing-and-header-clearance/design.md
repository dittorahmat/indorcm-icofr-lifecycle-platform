## Context

See `proposal.md` for background and user screenshots demonstrating the overlap issue and swimlane header crossings. In `BridgeEdge.tsx`, edges currently calculate orthogonal paths independently without global obstacle avoidance or channel coordination. In `ocr-layout.ts`, the initial node Y offset within swimlanes is positioned too close to the header ($Y = \text{HEADER\_H} + 30$), triggering upward loops that intersect the swimlane title bar.

## Goals / Non-Goals

**Goals:**
- Eliminate line penetration into swimlane headers across all diagram zooms and viewport states.
- Guarantee that parallel cross-lane connections do not share identical coordinate tracks (anti-overlap channel allocation).
- Ensure multi-document symbols and decision branches (YES/NO) exit and enter from the correct geometric sides without crossing node bodies.
- Maintain snappy rendering performance in React Flow with zero canvas lag.

**Non-Goals:**
- Arbitrary full-grid pathfinding (A* / Dijkstra) which could degrade 60fps canvas dragging performance.
- Changing BPM diagram data structures or schema.

## Decisions

### Decision 1: Strict Swimlane Ceiling Boundary in `BridgeEdge.tsx`
- **Choice**: Enforce a global minimum safe altitude for all edge waypoints:
  ```ts
  const SAFE_HEADER_BOTTOM = 100; // Header height (40) + margin (60)
  ```
  Whenever an edge calculates an escape or intermediate horizontal waypoint, clamp `y = Math.max(SAFE_HEADER_BOTTOM, calculatedY)`.
- **Alternative Considered**: Allowing edges to curve over swimlanes. Rejected because headers contain critical regulatory metadata (Department/Function) and must remain pristine.

### Decision 2: Multi-Channel Offsetting (Bus Routing) for Parallel Edges
- **Choice**: In `BridgeEdge.tsx`, group collinear edge segments (horizontal or vertical) connecting shared or adjacent columns, and apply an indexed offset:
  ```ts
  const channelIndex = getCollinearChannelIndex(edgeId, allParallelEdges);
  const offset = (channelIndex - (totalChannels - 1) / 2) * 20; // 20px track spacing
  ```
- **Alternative Considered**: Simple bezier curves. Rejected because BPMN and SK-5/DKU.MBU/11/2024 require strict 90-degree orthogonal connectors.

### Decision 3: Increased Initial Row Top Offset & Connection Side Heuristics
- **Choice**: In `ocr-layout.ts`, raise the first node row position to `HEADER_OFFSET = HEADER_H + 50` (or $110\text{px}$ minimum). Explicitly orient horizontal cross-lane edges from `right` (source) to `left` (target) rather than defaulting to `bottom` $\rightarrow$ `top`.

## Risks / Trade-offs

- **[Risk]** Large diagrams with many cross-column edges could consume vertical gutter space.
  - **Mitigation**: Spacing of 18–20px per channel provides clean separation without overly expanding swimlane heights.
- **[Risk]** Edge re-calculation on node drag.
  - **Mitigation**: Pure geometric math in `BridgeEdge.tsx` executes in sub-millisecond time, preserving smooth 60fps pan/zoom/drag.
