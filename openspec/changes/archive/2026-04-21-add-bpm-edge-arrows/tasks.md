## 1. BPM Editor Enhancements

- [x] 1.1 Import `MarkerType` from `reactflow` in `src/components/rcm/BPMEditor.tsx`
- [x] 1.2 Update `onConnect` in `BPMEditor.tsx` to include `markerEnd` with `MarkerType.ArrowClosed`
- [x] 1.3 Update the `useEffect` hook in `BPMEditor.tsx` to map through `diagram.edges` and add `markerEnd` to existing edges

## 2. BPM Viewer Enhancements

- [x] 2.1 Import `MarkerType` from `reactflow` in `src/components/rcm/CSAViewerModal.tsx`
- [x] 2.2 Update the `useEffect` hook in `CSAViewerModal.tsx` to map through `impact.diagram.edges` and add `markerEnd` to existing edges

## 3. Verification

- [x] 3.1 Verify that new connections in the BPM Editor display arrows
- [x] 3.2 Verify that saved diagrams load with arrows in both the Editor and the CSA Viewer Modal
