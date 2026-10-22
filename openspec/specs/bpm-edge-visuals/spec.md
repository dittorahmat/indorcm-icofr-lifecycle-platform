# bpm-edge-visuals Specification

## Purpose
TBD - created by archiving change add-bpm-edge-arrows. Update Purpose after archive.

## Requirements

### Requirement: Directional Arrows on BPM Edges
The BPM Editor and Viewer SHALL display directional arrows on all connections (edges) between nodes to indicate the flow of the business process.

#### Scenario: Dragging a new connection
- **WHEN** the user drags a connection from Node A to Node B in the BPM Editor
- **THEN** the resulting edge MUST display an arrow head pointing towards Node B

#### Scenario: Loading existing diagram
- **WHEN** a BPM diagram is loaded in the Editor or Viewer
- **THEN** all pre-existing edges MUST be rendered with directional arrow heads

### Requirement: Standardized Arrow Style
The system SHALL use a standardized closed triangle arrow head (`ArrowClosed`) for all BPM edges to maintain professional consistency.

#### Scenario: Visual inspection of edge
- **WHEN** an edge is rendered in the BPM diagram
- **THEN** its target end MUST feature a solid, closed triangular marker with a minimum size of 20px (width and height) and color matching the edge line.

### Requirement: Enhanced Edge Visibility
The connection lines (edges) SHALL be rendered with high contrast to ensure clarity of the process flow.

#### Scenario: Edge rendering style
- **WHEN** an edge is rendered in the BPM diagram
- **THEN** it MUST use a dark color (e.g., Slate-800 / #1e293b) and a stroke width of at least 2px.

### Requirement: Edge Layer Elevation Above Nodes
The BPM canvas SHALL render edge connection paths and arrowheads above node bodies in the stacking context so that connection paths and directional arrows are not obscured by node backgrounds.

#### Scenario: Edge connecting to target node
- **WHEN** an edge connects into a target node or passes near another node
- **THEN** the edge path and its arrowhead marker MUST remain visible above the node's background surface

#### Scenario: Edge marker rendering at target border
- **WHEN** an edge reaches the target node's handle
- **THEN** the arrowhead marker MUST terminate cleanly at the node's perimeter without being occluded by the node's internal background fill
