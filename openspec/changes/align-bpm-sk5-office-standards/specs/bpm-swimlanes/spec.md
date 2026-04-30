## ADDED Requirements

### Requirement: Functional Swimlanes
The BPM Editor SHALL allow the diagram to be organized into vertical or horizontal "Swimlanes" representing functional divisions as per SK-5 Lampiran 4.

#### Scenario: Adding a swimlane
- **WHEN** user clicks "Add Swimlane" in the Panel
- **THEN** system MUST render a column/row container with a header section.

### Requirement: Standardized Department and Function Labels
Each Swimlane SHALL feature two editable text boxes in the header area: one for **Department** and one for **Fungsi / Function**.

#### Scenario: Labeling a swimlane
- **WHEN** user clicks on the header of a swimlane
- **THEN** system MUST allow editing of "Department" and "Fungsi / Function" text values.

### Requirement: Division Line Rendering
Swimlanes SHALL be separated by clear division lines that act as boundaries for node organization.

#### Scenario: Visual inspection of layout
- **WHEN** multiple swimlanes are active
- **THEN** system MUST render vertical/horizontal grid lines separating each column/row.

### Requirement: Node-to-Swimlane Assignment
Nodes placed within a swimlane MUST be logically associated with that swimlane's Department/Function.

#### Scenario: Moving node between lanes
- **WHEN** user drags a node from Swimlane A to Swimlane B
- **THEN** the node's internal `department` and `function` metadata MUST update to match Swimlane B.
