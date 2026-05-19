## Context

The `SwimlaneNode` component in the BPM Editor has `Input` fields, but they are currently disconnected for existing diagrams because the `onChangeDepartment` and `onChangeFunction` handlers are only assigned when a new swimlane is created. For loaded diagrams, these handlers are missing from the node data.

## Goals / Non-Goals

**Goals:**
- Enable functional inline editing for all swimlanes (new and existing).
- Improve the visual design of inline inputs for better usability.
- Ensure state consistency between React Flow and the parent `BPMEditor` state.

**Non-Goals:**
- Adding inline editing for other node types (Start, End, Activity, etc.) at this stage, unless requested.
- Changing the underlying data structure of the BPM diagrams.

## Decisions

### 1. Dynamic Handler Injection
Instead of persisting function references in the database (which is impossible/bad practice), we will inject the necessary `onChange` handlers into the nodes' `data` object during the initialization phase in `BPMEditor.tsx`.
- **Rationale**: React Flow nodes are pure data in the database. Functional behavior must be attached at runtime.
- **Alternative**: Passing handlers via `nodeTypes` context. While possible, injecting into `data` is the established pattern in this codebase.

### 2. Styling with "Ghost" Inputs
We will style the `Input` components in `SwimlaneNode` to be borderless and transparent by default, but show a subtle background and border on hover or focus.
- **Rationale**: Maintains a clean diagram look while providing affordance for editing.

### 3. State Synchronization
We will use the existing `updateNodeData` callback in `BPMEditor` to handle updates. This ensures that `setNodes` is called, which in turn triggers the `isDirty` calculation.

## Risks / Trade-offs

- **Risk**: Performance degradation if too many nodes trigger updates.
- **Mitigation**: The updates are localized to individual swimlane nodes and only trigger standard React state updates.
- **Risk**: Event bubbling issues in React Flow.
- **Mitigation**: Use `nodrag` class on inputs to prevent dragging the node while typing.
