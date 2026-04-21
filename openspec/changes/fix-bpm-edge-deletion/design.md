## Context

The current `BPMEditor` uses `useNodesState` and `useEdgesState` from `reactflow`, but doesn't explicitly handle the `onNodesDelete` and `onEdgesDelete` events. While `reactflow` has built-in deletion logic, it may fail if the component doesn't have focus or if custom state synchronization is required.

## Goals / Non-Goals

**Goals:**
- Enable deletion of nodes and edges via keyboard.
- Provide user feedback (toast) upon deletion.
- Ensure state remains in sync between `reactflow` and the parent component.

**Non-Goals:**
- Adding context menus for deletion.
- Implementing "Undo" functionality (out of scope for this fix).

## Decisions

### 1. Implement `onNodesDelete` and `onEdgesDelete`
- **Rationale**: Explicitly handling these events allows us to trigger side effects (like toasts) and ensures that our state update logic is clear and predictable.
- **Implementation**: 
  ```tsx
  const onNodesDelete = useCallback((deletedNodes) => {
    toast.info(`Deleted ${deletedNodes.length} node(s)`);
  }, []);
  
  const onEdgesDelete = useCallback((deletedEdges) => {
    toast.info(`Deleted ${deletedEdges.length} connection(s)`);
  }, []);
  ```

### 2. Ensure Focusability
- **Rationale**: Keyboard events in `reactflow` only work if the wrapper or the container has focus.
- **Implementation**: Ensure the `ReactFlow` container has a `tabIndex` or that the wrapper is focused upon interaction.

## Risks / Trade-offs

- **[Risk]** → Accidental deletion of large process parts.
  - **Mitigation** → Toast notification provides immediate awareness; users can avoid saving if they make a mistake.
