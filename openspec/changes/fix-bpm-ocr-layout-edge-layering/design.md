# Design

## Context

See `proposal.md` for background and user issue reports.
In the current BPM canvas architecture:
1. `src/utils/ocr-lane-geometry.ts` and `src/utils/ocr-layout.ts` calculate lane widths and node positions. Lane widths currently only consider the maximum single-node width (`Math.max(LANE_MIN_W, globalMaxNodeWidth + 180)`), forcing multi-branch ranks to cluster within a narrow column with small offsets (`stepOffset <= 30px`).
2. `src/components/rcm/editor/canvas-hydration.ts` assigns `zIndex: 10` to standard nodes and `-1` to swimlanes. ReactFlow renders the `.react-flow__edges` SVG container at the same z-level or under nodes by default. Because node DOM wrappers have solid `bg-white`, edges entering or passing under nodes get visually occluded.

## Goals / Non-Goals

**Goals:**
- Provide clear, spacious auto-arranged layouts for OCR imports regardless of node count and branch complexity.
- Elevate edge and arrowhead rendering above node background fills without interfering with floating badges or interaction handles.
- Maintain full determinism and backward compatibility for existing diagrams.

**Non-Goals:**
- Replacing the deterministic rule-based OCR layout with third-party graph layout libraries (e.g. Dagre, Elk).
- Modifying backend OCR extraction schemas or vision prompt contracts.

## Decisions

### 1. Dynamic Swimlane Width Based on Concurrent Rank Nodes
- **Decision**: In `computeLaneWidths` (`src/utils/ocr-lane-geometry.ts`), compute the maximum parallel node count for any rank in each swimlane (`maxRankParallel`). If `maxRankParallel > 1`, set swimlane width to:
  `Math.max(LANE_MIN_W, maxRankParallel * (maxNodeWidth + HORIZONTAL_SPACING) + PADDING)`.
- **Alternative considered**: Keeping fixed lane widths and stacking parallel nodes purely vertically.
  *Rejected*: Visual process flows with concurrent branches become confusing when linearized vertically, especially decision diamond exits.

### 2. Generous Vertical and Horizontal Spacing
- **Decision**: In `src/utils/ocr-layout.ts`:
  - Increase minimum vertical separation between consecutive ranks: `targetY = Math.max(targetY, lastUsedY + 50)`.
  - Distribute multiple nodes in the same rank horizontally with comfortable spacing (gap >= 40px), centered within the expanded swimlane.
- **Alternative considered**: Dynamically calculating based only on text line counts.
  *Rationale*: Node heights already expand cleanly when dimensions are standardized; enforcing a solid 50px floor guarantees ample room for labels and connection turns.

### 3. Z-Index and Stacking Context Harmonization
- **Decision**:
  - In `src/components/rcm/editor/BPMCanvas.tsx`: Apply CSS class or inline style to elevate `.react-flow__edges` (`z-index: 10`).
  - In `src/components/rcm/editor/canvas-hydration.ts`: Set node chrome `zIndex` to 5 for regular nodes, maintaining `-1` for swimlanes, `20` for regulatory badges, and `30` for active/dragging handles.
- **Alternative considered**: Setting node backgrounds to transparent.
  *Rejected*: Transparent nodes cause grid lines and swimlane borders to show through node text and shapes, creating visual noise.

## Risks / Trade-offs

- **[Risk]** Very wide diagrams on workflows with 4+ parallel branches.
  → *Mitigation*: Cap horizontal branch expansion to reasonable limits and let ReactFlow auto-fit / zoom handle large canvas navigation.
- **[Risk]** Edges passing directly over node text if routed clumsily.
  → *Mitigation*: The orthogonal router (`orthogonal-router.ts`) routes around node bounds using channel offsets; elevating edges ensures arrowhead markers at boundaries are crisp while keeping waypoint interactions functional.
