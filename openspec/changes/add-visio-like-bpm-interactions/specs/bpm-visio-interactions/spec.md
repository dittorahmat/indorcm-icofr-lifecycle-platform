## Purpose

Provides Microsoft Visio-like visual interactions on the BPM canvas, including 8 bidirectional connection handles on process nodes, smart alignment guides, and quick-connect hover arrows.

## ADDED Requirements

### Requirement: 8 Universal Connection Handles
Every BPM process shape (all 31 process node variants) SHALL provide 8 visible and interactive connection points located at: top-left, top-center, top-right, middle-left, middle-right, bottom-left, bottom-center, and bottom-right. Each handle SHALL support both incoming (target) and outgoing (source) edge connections.

#### Scenario: User draws connection from side or corner
- **WHEN** user drags a connector starting from the middle-right or bottom-right handle of an Activity node to the middle-left handle of another node
- **THEN** the edge connects cleanly between the specified handles without defaulting to top or bottom

#### Scenario: Visual handle appearance on node hover
- **WHEN** user hovers over or selects a BPM node on the canvas
- **THEN** the 8 circular connection handles highlight and expand slightly for effortless targeting

### Requirement: Dynamic Smart Alignment Guides
The BPM canvas SHALL render dynamic smart alignment guidelines (horizontal and vertical dashed lines) whenever a dragged node aligns with other nodes on the canvas within a 5px threshold (snapping center-to-center or edge-to-edge).

#### Scenario: Aligning nodes horizontally
- **WHEN** user drags a node such that its vertical center aligns with the vertical center of an adjacent node within 5px
- **THEN** a dashed horizontal guide line appears across the canvas and the dragged node snaps to the alignment axis

#### Scenario: Drag stop clears guides
- **WHEN** user releases the mouse after dragging
- **THEN** all alignment guide lines disappear immediately from the canvas

### Requirement: Quick-Connect Hover Arrows
Process nodes SHALL display 4 directional quick-connect arrows (top, bottom, left, right) when hovered, enabling one-click or direct drag creation of connections to adjacent shapes.

#### Scenario: Dragging from quick connect arrow
- **WHEN** user clicks and drags from any of the 4 directional quick-connect arrows on a node
- **THEN** a new connector edge starts dragging directly toward the cursor to connect to a target node
