## Context

Currently, the BPM editor in IndoGRC Pro uses Bezier curves for edges, which can overlap directly. When they cross, it looks like an "X", which is visually confusing. The user wants crossing lines to have a "bridge" (line jump/crossover) to indicate that they do not intersect logically.

## Goals / Non-Goals

**Goals:**
- Implement a custom React Flow edge component (`BridgeEdge`) that draws a visual semi-circular bridge (arc) whenever a horizontal segment of the edge intersects a vertical segment of another edge.
- Register `BridgeEdge` in the React Flow `edgeTypes` map in `BPMEditor.tsx`.
- Configure the default edge type to be `bridge` when drawing or rendering lines.

**Non-Goals:**
- Implementing advanced, generic pathfinding for all edge paths. We will focus on step-based/orthogonal intersections which are standard for BPM diagrams.
- Resolving overlaps of nodes or edges that run exactly on top of each other.

## Decisions

### 1. Edge Style
We will use an orthogonal step style (`smoothstep`) as the base for the `BridgeEdge`. Orthogonal paths make it deterministic and easy to calculate horizontal-vertical intersection points.

### 2. Intersection Calculation
- The `BridgeEdge` component will retrieve all edges from the React Flow state.
- It will compute the line segments for the current edge and other active edges.
- It will find intersection points between horizontal segments of the current edge and vertical segments of other edges.
- At each intersection point, the SVG path will be modified to include a `A` (arc) command to draw a bridge (e.g. jumping over the vertical line).

## Risks / Trade-offs

- **[Risk] Performance with many edges** -> If a diagram has hundreds of edges, recalculating intersections on every render can be slow.
  - *Mitigation:* We will keep the intersection math extremely lightweight and fast, and only compare with active visible edges or use simple bounding box checks.
