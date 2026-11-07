# BPM Routing, Canvas Architecture & Gesture Invariants

This guide documents the layout, connection handling, and geometric routing standards for the BPM (Business Process Mapping) editor, aligned with Regulation SK-5/DKU.MBU/11/2024 (Lampiran 3).

## 1. Single Source of Truth Constants
All geometry constants, connection thresholds, and layer order definitions MUST be imported from `@/utils/bpm-constants` (or `src/utils/bpm-constants.ts`):
* `DOWNWARD_PLUNGE_THRESHOLD_DY`: Minimum descent threshold (40px) to orient edge target into the top handle.
* `SAME_LANE_SEQUENTIAL_FLOW_THRESHOLD_DY`: Vertical descent threshold (15px) for strict sequential bottom-to-top flow within the same swimlane.
* `SAFE_HEADER_CEILING`: Safe ceiling (100px) preventing edge waypoints from crossing into swimlane headers.
* `BPM_CANVAS_Z_INDEX`: Canonical layering hierarchy (`SWIMLANE: -1`, `SHAPE: 5`, `EDGE: 10`, `BADGE: 20`, `HANDLE_DRAG: 30`). Edges must always render above shape cards (`EDGE > SHAPE`) so lines never sink behind solid node backgrounds.

Never declare ad-hoc magic numbers (e.g. `dy > 40`, `dy > 15`, `zIndex: 5`) inside canvas components or OCR layout routines.

## 2. Connection Gesture Integrity (Anti-Inversion)
Under React Flow's `ConnectionMode.Loose`, connection drop snapping onto a target node that contains stacked `source` and `target` handles may cause React Flow to invert the connection parameters (`source` = drop node, `target` = drag start node).

To preserve gesture integrity:
1. Canvas handlers MUST track drag origin (`connectOriginRef`) on `onConnectStart`.
2. The `onConnect` callback MUST normalize connections using `normalizeConnectionDirection` (`src/utils/bpm-connection-direction.ts`).
3. Connection edges are guaranteed to flow strictly from user drag start ($A$) to user drop location ($B$).

## 3. Lateral Routing & Obstacle Clearance
When routing edges laterally (e.g., exiting from `right` or `left` of Decision diamonds or process boxes) into a node positioned below:
* The route must step outward horizontally with at least 24px clearance past the source node boundary.
* The route must descend in a safe vertical corridor and enter the target's top handle from above with at least 20px vertical clearance.
* Route segments MUST NOT cross inside the inner bounding box of the target node.
* Any changes to lateral routing must be locked with bounding-box collision tests in `src/components/rcm/__tests__/BPMEdgeRouting.test.ts`.

## 4. OCR Sequential Edge Hierarchy
For diagrams parsed or imported via OCR:
* Sequential nodes placed vertically in the same swimlane must enforce `sourceHandle: 'bottom'` -> `targetHandle: 'top'` whenever $dy > \text{SAME\_LANE\_SEQUENTIAL\_FLOW\_THRESHOLD\_DY}$.
* Cross-lane jumps must maintain clean orthogonal lateral exit (`right`/`left`) into the target `top` handle.
