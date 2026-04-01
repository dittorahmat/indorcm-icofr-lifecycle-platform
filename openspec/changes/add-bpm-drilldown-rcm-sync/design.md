# Design: BPM Drilldown & RCM Synchronization

## Architecture & UI/UX
-   **Drilldown Interface:**
    -   Enhance the **Node Detail Sidebar** in `BPMEditor.tsx`.
    -   Use **Nested Lists** or **Tabs** within the sidebar to show hierarchy (e.g., "Details", "Associated Risks", "Mitigating Controls").
    -   Clicking an item in the sidebar list updates the sidebar to show *that* item's details (Navigation Stack).

-   **ReactFlow Custom Nodes Updates:**
    -   **ArchiveNode:** Change shape from rectangle to **Cylinder** (SVG/CSS) to match SK-5/2024.
    -   **Node Tooltips:** Add hover tooltips showing a preview of linked Risks/Controls.

-   **Data Sync Strategy:**
    -   Extend `BPMNode` data to include `riskIds: string[]` and `controlIds: string[]`.
    -   Refactor `syncStatus` in `BPMEditor` to perform cross-reference checks between `rcm.controls` and `bpmData.nodes`.

## Data Model Updates
-   **BPMNode:**
    ```typescript
    interface BPMNode {
      id: string;
      type: string;
      data: {
        label: string;
        riskIds?: string[]; // Multiple risks per process node
        controlIds?: string[]; // Multiple controls per risk node
        // ...existing fields
      }
    }
    ```

## Logic
-   **Hierarchy Traversal:**
    -   `ProcessNode` -> `Filter RCM Risks` -> `Filter Control Matrix`.
-   **Validation Engine:**
    -   Identify "Ghost Controls": IDs present in BPM but missing in RCM Matrix.
    -   Identify "Unmapped Controls": IDs present in RCM Matrix but missing in BPM Diagram.
