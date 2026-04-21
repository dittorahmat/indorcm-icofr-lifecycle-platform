## 1. Implement Deletion Handlers

- [x] 1.1 Implement `onNodesDelete` and `onEdgesDelete` using `useCallback` in `BPMEditor.tsx`.
- [x] 1.2 Add toast notifications to the deletion handlers.

## 2. Update ReactFlow Configuration

- [x] 2.1 Pass `onNodesDelete` and `onEdgesDelete` to the `ReactFlow` component in `BPMEditor.tsx`.
- [x] 2.2 Add `deleteKeyCode={["Delete", "Backspace"]}` prop to `ReactFlow` to ensure both keys work.

## 3. Verification

- [x] 3.1 Verify that selecting an edge and pressing 'Delete' removes the edge and shows a toast.
- [x] 3.2 Verify that selecting a node and pressing 'Backspace' removes the node and its connections.
