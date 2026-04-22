## MODIFIED Requirements

### Requirement: Standardized Arrow Style
The system SHALL use a standardized closed triangle arrow head (`ArrowClosed`) for all BPM edges to maintain professional consistency.

#### Scenario: Visual inspection of edge
- **WHEN** an edge is rendered in the BPM diagram
- **THEN** its target end MUST feature a solid, closed triangular marker with a minimum size of 20px (width and height) and color matching the edge line.

## ADDED Requirements

### Requirement: Enhanced Edge Visibility
The connection lines (edges) SHALL be rendered with high contrast to ensure clarity of the process flow.

#### Scenario: Edge rendering style
- **WHEN** an edge is rendered in the BPM diagram
- **THEN** it MUST use a dark color (e.g., Slate-800 / #1e293b) and a stroke width of at least 2px.
