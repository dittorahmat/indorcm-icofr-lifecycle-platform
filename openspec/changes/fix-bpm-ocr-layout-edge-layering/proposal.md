# Proposal

## Why

When users upload complex BPM flowcharts via OCR (especially diagrams with many nodes per lane or parallel branches), nodes currently clump together tightly due to rigid vertical step offsets (`lastUsedY + 28px`) and cramped horizontal distribution (`stepOffset <= 30px`). In addition, edges and arrowheads frequently appear submerged behind node backgrounds because default ReactFlow HTML nodes render above the SVG edge layer (`zIndex: 10` on nodes vs un-elevated SVG edges), obscuring process flows.

Refining OCR auto-layout spacing and elevating the edge layer above node containers ensures dense multi-node diagrams import cleanly and process connections remain clearly visible without manual rearrangement.

## What Changes

- **Dynamic Swimlane & Spacing Geometry**:
  - Automatically calculate parallel node branching density per swimlane rank and dynamically widen swimlanes when concurrent nodes exist.
  - Increase vertical step offsets and minimum clearance between sequentially placed nodes (`ROW_HEIGHT` adapted to node height + label clearance, minimum gap `lastUsedY + 50px`).
  - Provide symmetric horizontal spreading for parallel nodes within ranks with comfortable separation (40px - 60px).
- **Edge Layer Elevation & Stacking Context**:
  - Elevate ReactFlow SVG edge container (`.react-flow__edges`) above node card containers so lines and directional arrows never get submerged behind solid node backgrounds.
  - Standardize z-index hierarchy: Swimlane (-1) < Node Card (5) < Edges (10) < Floating Badges (20) < Active Handles (30).
  - Ensure arrowhead endpoints align accurately with outer shape boundaries, preventing clipping by node containers.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `bpm-edge-visuals`: Add requirements for edge layer elevation and non-occlusion over node bodies.
- `bpm-multi-page-ocr`: Enhance OCR diagram layout requirements to mandate non-overlapping node positioning and dynamic swimlane expansion for parallel branches.

## Impact

- Modified files:
  - `src/utils/ocr-lane-geometry.ts` (dynamic lane width calculation based on parallel node density)
  - `src/utils/ocr-layout.ts` (rank vertical spacing and multi-node horizontal distribution)
  - `src/components/rcm/editor/canvas-hydration.ts` (node z-index standardization)
  - `src/components/rcm/editor/BPMCanvas.tsx` (edge layer elevation style)
  - `src/components/rcm/edges/geometry/orthogonal-router.ts` (target anchor clearance)
  - Associated unit tests (`src/test/ocr-layout.test.ts`, `src/components/rcm/edges/__tests__/`)
