## ADDED Requirements

### Requirement: Dynamic Migration Backlog
The BPM Editor SHALL dynamically display a list of unmapped RCM items for the currently active process and fiscal year in the "Migration Backlog" sidebar.

#### Scenario: Viewing the backlog
- **WHEN** the user opens the BPM Editor for a process that has uploaded RCM data but no diagram nodes
- **THEN** the system SHALL display all those uploaded RCM items in the Migration Backlog section

### Requirement: Reactive Backlog State
The Migration Backlog SHALL automatically update based on the state of the React Flow canvas.

#### Scenario: Dropping an item
- **WHEN** an item is successfully dropped onto the canvas and becomes a node
- **THEN** the system SHALL remove that item from the Migration Backlog list

#### Scenario: Deleting a node
- **WHEN** a user deletes an activity node from the canvas that contains mapped RCM data
- **THEN** the system SHALL return that RCM item to the Migration Backlog list

### Requirement: Node Auto-generation via Drag and Drop
Users SHALL be able to drag an item from the Migration Backlog and drop it onto the canvas to automatically generate a linked Activity node.

#### Scenario: Creating a linked node
- **WHEN** the user drags a backlog item and drops it on the empty canvas
- **THEN** the system SHALL create a new `activity` node at the drop coordinates
- **AND** the new node SHALL be automatically populated with the `regulatoryPairs` data corresponding to the dropped RCM item
