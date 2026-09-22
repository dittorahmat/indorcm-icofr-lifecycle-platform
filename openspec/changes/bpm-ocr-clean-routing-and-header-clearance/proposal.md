## Why

Importing complex business process diagrams via OCR frequently produces overlapping horizontal/vertical connector lines and causes edges to intersect or cut across swimlane headers. This degrades readability, obscures department/function labels, and fails the professional presentation standards required by SK-5/DKU.MBU/11/2024.

## What Changes

- **Swimlane Header Clearance (Ceiling Boundary)**: Enforce a strict minimum safe Y ceiling constraint on edge routing calculations and OCR node layout so that connectors never cross, cut through, or overlap swimlane header regions.
- **Parallel Edge Channel Offsetting (Anti-Overlap Bus Routing)**: Distribute overlapping collinear orthogonal edge segments across distinct gutter channels (with 18px–24px spacing) to eliminate coincident line stacking.
- **Topological Row Padding & Distribution**: Increase the vertical offset for the initial node row within swimlanes ($Y \ge 95\text{px}$) and improve cross-swimlane port assignment (`right` -> `left` or `bottom` -> `top`) to prevent jagged back-loops and shape crossings.
- **Multi-Document Consolidation**: Improve parsing and clustering for stacked multi-document symbols so bundles (e.g., Formulir + KTP + Emas) render cleanly as a unified entity.

## Capabilities

### Modified Capabilities
- `bpm-edge-visuals`: Add requirements for swimlane header clearance and anti-overlap parallel edge channel separation.

## Impact

- `src/components/rcm/edges/BridgeEdge.tsx`: Orthogonal route generation logic, ceiling limit enforcement, and parallel channel offsetting.
- `src/utils/ocr-layout.ts`: Initial row header offset, handle direction assignment, and multi-document positioning.
- `worker/routes/bpm.ts`: OCR system prompt instructions for multi-document consolidation and edge handle direction hints.
