## ADDED Requirements

### Requirement: Keyboard Deletion of Edges
The BPM Editor SHALL allow users to delete a selected connection (edge) by pressing the 'Delete' or 'Backspace' key.

#### Scenario: Deleting a connection
- **WHEN** an edge is selected (highlighted) and the user presses the 'Delete' key
- **THEN** the edge MUST be removed from the diagram and a success toast SHALL be displayed

### Requirement: Keyboard Deletion of Nodes
The BPM Editor SHALL allow users to delete selected nodes by pressing the 'Delete' or 'Backspace' key.

#### Scenario: Deleting a node
- **WHEN** a node is selected and the user presses the 'Delete' key
- **THEN** the node and all its connected edges MUST be removed from the diagram

### Requirement: Interaction Feedback
The system SHALL provide immediate visual or textual feedback when an element is successfully deleted from the diagram.

#### Scenario: Deletion confirmation
- **WHEN** any element (node or edge) is deleted via keyboard
- **THEN** the system SHALL display a toast notification confirming the deletion
