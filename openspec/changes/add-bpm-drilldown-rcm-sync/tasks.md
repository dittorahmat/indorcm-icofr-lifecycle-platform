## 1. Compliance Alignment (SK-5/2024)

- [x] 1.1 Update `ArchiveNode` component in `BPMEditor.tsx` to use Cylinder shape (SVG).
- [x] 1.2 Implement hover tooltips for nodes to preview linked risks/controls.

## 2. BPM Drilldown Implementation

- [x] 2.1 Enhance Node Selection logic in `BPMEditor.tsx` to include navigation state.
- [x] 2.2 Create `DrilldownPanel` component for the sidebar showing:
    - [x] List of Risks associated with Process nodes.
    - [x] List of Controls associated with Risk nodes.
    - [x] Full detail view for individual Controls.
- [x] 2.3 Implement "Back" navigation in the Sidebar to return to top-level node properties.

## 3. RCM Matrix Synchronization

- [x] 3.1 Update `syncStatus` logic to detect "Ghost Controls" (IDs in BPM but deleted from Matrix).
- [x] 3.2 Add visual warning badge for "Unmapped Controls" (Matrix has them, BPM doesn't).
- [x] 3.3 Ensure Drilldown displays all mitigating controls from RCM Matrix.

## 4. Testing & Validation

- [x] 4.1 Verify that clicking a Risk hexagon in BPM displays its controls in the sidebar.
- [x] 4.2 Verify that the "Arsip" node now matches the "System" node shape (Cylinder).
- [x] 4.3 Ensure changes to linked controls in BPM are correctly persisted to `bpmData`.
