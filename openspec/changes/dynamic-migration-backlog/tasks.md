## 1. Data Fetching and State Management

- [x] 1.1 Use `useQuery` to fetch RCM Matrix TLC data for the current `bpmProcessId` and `workingYear` inside `BPMEditor.tsx`.
- [x] 1.2 Implement a `useMemo` hook to calculate the `unmappedControls` array by comparing the fetched matrix data against the `nodes` state array (filtering out items where `riskId` is already in a node's `regulatoryPairs`).

## 2. Dynamic Sidebar UI

- [x] 2.1 Replace the hardcoded placeholders in the Migration Backlog section with a `.map()` over the `unmappedControls` array.
- [x] 2.2 Display relevant data for each backlog item, such as `mappedControlName` (or `riskDescription` as fallback) and `controlCode`.

## 3. Drag and Drop Implementation

- [x] 3.1 Make each dynamic backlog item `draggable`.
- [x] 3.2 Add an `onDragStart` handler to the backlog items that sets the data payload (the stringified JSON of the unmapped control) using `e.dataTransfer.setData('application/reactflow', ...)`.
- [x] 3.3 Add `onDragOver` handler to the `ReactFlow` component to enable drop zones (calling `e.preventDefault()`).
- [x] 3.4 Implement the `onDrop` handler on the `ReactFlow` component to intercept the drop event, parse the JSON payload, and calculate the drop position.
- [x] 3.5 Inside the `onDrop` handler, generate a new `activity` node pre-populated with the dropped item's data inside its `regulatoryPairs` array, and append it to the `nodes` state.

## 4. Verification

- [x] 4.1 Test dragging an item from the backlog to the canvas. Verify a node is created and the item disappears from the backlog.
- [x] 4.2 Test deleting that newly created node from the canvas. Verify the item immediately reappears in the backlog.
