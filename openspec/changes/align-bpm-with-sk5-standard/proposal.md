# Proposal: Align BPM Editor with SK-5/2024 Standards (Docking Nodes)

## Problem Statement
The current BPM implementation in `BPMEditor.tsx` uses a flat node structure where Activities, Risks, and Controls are independent nodes connected by manual edges. This does not follow **Lampiran 4 of SK-5/2024**, which illustrates Risks and Controls as elements "attached" to an Activity. The current UI leads to cluttered diagrams ("spaghetti lines") and lacks semantic audit relationships.

## Proposed Changes
Transform the BPM Editor from a generic flowchart tool into a hierarchical audit-logic-driven editor.

### 1. Visual Overhaul (Docking Logic)
- Implement **Summary Nodes**: Each Activity node will have at most ONE Red Hexagon (Risk) and ONE Green Circle (Control) docked to its bottom border.
- **Counter Badges**: Show numbers (e.g., ⬢², ○³) to indicate how many risks/controls are linked to that activity.
- **Parent-Child Hierarchy**: Use React Flow's sub-node feature to ensure docked icons move together with the Activity.

### 2. Semantic Data Model
- Define clear hierarchy: `Activity (Node) -> Multiple Risks -> Multiple Controls`.
- Support **Many-to-Many** mapping: Risks and Controls can be linked to multiple Activities across different diagrams.
- Store these relationships in the backend (`worker/db/schema.ts`) to ensure synchronization with the Risk Control Matrix (RCM).

### 3. User Interaction
- **Activity Context**: Clicking an Activity reveals "Add Risk" and "Add Control" buttons in the sidebar.
- **Icon Context**: Clicking the docked Hexagon/Circle filters the sidebar to focus on those specific lists.
- **Unlink vs Delete**: 
    - **Unlink**: Removes the relationship between the data and the specific Activity.
    - **Delete**: Deletes the data from the entire system (with a mandatory warning if used in other activities).

## Goals
- Full compliance with SK-5/2024 visual standards.
- Reduced diagram complexity.
- Automatic synchronization between BPM visual flow and RCM documentation.
