## ADDED Requirements

### Requirement: Interactive Waypoint Handle for Selected Edge
When a connector (edge) is selected in the BPM Editor, the system SHALL render draggable waypoint control handle(s) along its orthogonal segments.

#### Scenario: Edge selection reveals control handles
- **WHEN** the user clicks to select a connection line in the BPM Editor
- **THEN** the edge displays interactive circular waypoint handle(s) at movable segment positions with visual indicator and grab/resize cursor

#### Scenario: Edge deselection hides control handles
- **WHEN** the user clicks on canvas background or another element, deselecting the edge
- **THEN** the waypoint control handle(s) MUST disappear from the canvas

### Requirement: Visio-Style Drag-to-Reposition Bend Coordinates
The user SHALL be able to drag the waypoint handle to relocate intermediate orthogonal segments in real time.

#### Scenario: Dragging vertical or horizontal segment
- **WHEN** the user drags a waypoint handle on an orthogonal segment
- **THEN** the corresponding segment coordinate updates in real time, shifting the connected orthogonal bends while maintaining strict 90-degree angles

#### Scenario: Dragging to single-corner (L-shape) alignment
- **WHEN** the user drags a 2-corner step segment until it aligns with the source or target handle axis
- **THEN** the intermediate step collapses and the line renders as a clean single-corner (1-bend L-shape) connector

### Requirement: Double-Click Reset Waypoint to Auto
The system SHALL allow resetting custom waypoint coordinates back to the default auto-calculated orthogonal path.

#### Scenario: Double clicking waypoint handle
- **WHEN** the user double-clicks on an active edge waypoint handle
- **THEN** the edge clears any manual bend offset and returns to the default automatic channel path

### Requirement: Waypoint State Persistence & Undo/Redo
Custom waypoint positions MUST be preserved in the edge data structure and integrated into canvas history.

#### Scenario: Undo after dragging waypoint
- **WHEN** the user drags an edge waypoint to a new position and then triggers Undo (Ctrl+Z or toolbar button)
- **THEN** the edge waypoint reverts to its prior position
- **WHEN** the diagram is saved and reloaded
- **THEN** the saved waypoint offsets MUST be restored exactly as saved
