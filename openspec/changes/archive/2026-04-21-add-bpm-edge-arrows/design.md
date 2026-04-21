## Context

The BPM components (`BPMEditor` and `CSAViewerModal`) use `reactflow` to render process diagrams. Currently, edges are rendered as simple lines. The user has requested directional arrows to clarify the process flow.

## Goals / Non-Goals

**Goals:**
- Implement directional arrows on all BPM edges using `reactflow`'s `markerEnd` property.
- Ensure consistent appearance between the editor and viewer.
- Maintain compatibility with existing saved diagram data by dynamically injecting arrow properties during hydration.

**Non-Goals:**
- Adding custom edge types or complex edge animations.
- Modifying the underlying data schema for edges (arrows will be applied at runtime/during save).
- Changing the visual style of nodes or backgrounds.

## Decisions

### 1. Use `MarkerType.ArrowClosed`
- **Rationale**: Provides a solid, professional appearance that matches industry standards for flowcharts and BPMN diagrams.
- **Alternatives**: `MarkerType.Arrow` (too thin/minimal), custom SVG markers (overly complex for this requirement).

### 2. Runtime Injection for Existing Edges
- **Rationale**: Instead of running a database migration to update all existing edge objects, we will map the edges in the `useEffect` hook that handles diagram hydration. This ensures immediate effect across all existing processes.
- **Implementation**: `setEdges(diagram.edges.map(e => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } })))`.

### 3. Update `onConnect` Params
- **Rationale**: Ensures that new edges created via drag-and-drop immediately show the arrow without waiting for a re-save/re-load cycle.

## Risks / Trade-offs

- **[Risk]** → Visual clutter in very dense diagrams. 
  - **Mitigation** → Use standard sizes for markers and ensure spacing between nodes is adequate.
- **[Risk]** → Performance impact on very large diagrams (100+ nodes/edges).
  - **Mitigation** → `reactflow` handles markers efficiently; mapping edges during hydration is an O(N) operation and shouldn't be noticeable.
