# Proposal: BPM Drilldown & RCM Synchronization

## Business Case
User needs to explore the RCM (Risk Control Matrix) directly from the BPM (Business Process Map). 
Currently, the BPM is just a visualization tool. Making it interactive ("Drilldown") allows users to see:
1.  **Process Context:** What is happening? (BPM Node)
2.  **Risk Context:** What can go wrong? (Linked Risk)
3.  **Control Context:** How do we mitigate it? (Linked Control)

## Goals
-   Enable **Node Drilldown**: Clicking a BPM node reveals a list of associated Risks.
-   Enable **Risk Drilldown**: Clicking a Risk node reveals a list of associated Controls.
-   Ensure **Bidirectional Sync**: Changes in the RCM Matrix should reflect in the BPM "Out of Sync" warnings.
-   Update **Archive Node Shape**: Align with SK-5/2024 (Cylinder/Silinder).

## Scope
-   **BPMEditor.tsx:** Implement a side-panel or nested view for the drilldown.
-   **ReactFlow Custom Nodes:** Update `ArchiveNode` to use a cylinder shape.
-   **Sync Logic:** Enhance `syncStatus` in `BPMEditor` to check 1-to-Many relationships (Process -> Risk -> Control).

## Out of Scope
-   Automated AI-based Risk identification (manual linking only).
-   Real-time multi-user collaboration on the diagram (stays per-session).
