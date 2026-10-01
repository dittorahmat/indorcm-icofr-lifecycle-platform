## ADDED Requirements

### Requirement: Interactive Kanban Drag and Drop Progression
The system SHALL allow authorized users to drag and drop deficiency action plan cards between Kanban status columns in accordance with the regulatory SK-5 deficiency remediation workflow.

#### Scenario: Dropping into another column
- **WHEN** user drags a deficiency card from "Ineffective" and drops it into "In Review"
- **THEN** the column container SHALL receive the drop event via its droppable boundary
- **AND** the system SHALL invoke the regulatory workflow action to advance the item's `workflowStatus`
- **AND** update the Kanban board state optimistically with toast feedback

#### Scenario: Dropping into empty column
- **WHEN** user drags a card into a column with 0 cards
- **THEN** the droppable target of the column SHALL accept the drop and trigger the appropriate status transition
