## Context

The BPM Editor allows users to visually model processes. When migrating from legacy spreadsheets, a large number of risks and controls are uploaded but not visually placed. The editor has a sidebar section for "Migration Backlog", but it currently contains hardcoded dummy data. This forces users to manually create empty nodes and individually link them to uploaded RCM records, severely impacting productivity.

## Goals / Non-Goals

**Goals:**
- Dynamically fetch unmapped RCM records for the currently active BPM process.
- Allow users to drag items from the backlog list onto the React Flow canvas.
- Auto-generate complete `activity` nodes that are already linked to the dropped risk/control data.
- Ensure the backlog list updates in real-time as items are placed on the canvas.

**Non-Goals:**
- Automated layout/auto-arrange of nodes (users still choose where to drop).
- Support for dragging multiple items at once.

## Decisions

### 1. Fetching Backlog Data
- **Choice**: Utilize the existing `/api/rcm-matrix/tlc` endpoint within `BPMEditor.tsx`.
- **Rationale**: Since we recently fixed this endpoint to return all items (via `leftJoin`) and support `year` filtering, it's the perfect source. We can filter the result set client-side to find items where the `riskId` is not present in the current React Flow `nodes` state.

### 2. Drag-and-Drop Implementation
- **Choice**: Use HTML5 `draggable` API combined with React Flow's native `onDrop` capabilities.
- **Rationale**: React Flow is explicitly designed to handle HTML5 drop events. By setting `e.dataTransfer.setData` on the backlog item's `onDragStart`, we can easily pass the complex JSON payload of the RCM item to the canvas.

### 3. Auto-Generating Nodes
- **Choice**: On drop, parse the transferred JSON payload and push a new node object into the `nodes` state array.
- **Rationale**: The new node must conform to the existing `regulatoryPairs` structure used in the `activity` node type. This ensures that the custom node component renders the RCM badge correctly and that the save logic (`updateDiagram`) processes it without backend schema changes.

## Risks / Trade-offs

- **[Risk] Multiple Controls per Risk**: An uploaded CSV might have one risk mapped to multiple controls. 
  - **Mitigation**: The matrix data usually flattens this (one row per control mapping). Dropping an item will create an activity node for that specific risk-control pair. If users want to group them, they can manually edit the node properties later.
- **[Risk] State Desync**: If a user deletes a node from the canvas, it should reappear in the backlog.
  - **Mitigation**: The backlog list should be a derived state (`useMemo`) calculated by comparing the full matrix data against the current `nodes` array. If a node is deleted, the `nodes` array shrinks, and the derived backlog state naturally expands.
