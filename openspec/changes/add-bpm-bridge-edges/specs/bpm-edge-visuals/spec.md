## ADDED Requirements

### Requirement: Crossover Bridge (Line Jump) on Overlapping Edges
The BPM Editor and Viewer SHALL display a visual crossover bridge (line jump) when two edges intersect, indicating that the process lines cross without a logical connection.

#### Scenario: Intersecting edges rendering
- **WHEN** two edges in the BPM diagram intersect
- **THEN** the system MUST render a semi-circular arc (bridge) on the intersecting segment of one edge to visually hop over the other edge.

#### Scenario: Visual style of the bridge
- **WHEN** a crossover bridge is rendered on an edge
- **THEN** it MUST match the color and stroke width of the host edge and have a radius of at least 6px to ensure clear visibility.
