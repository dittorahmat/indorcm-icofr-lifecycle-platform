## ADDED Requirements

### Requirement: Multi-Anchor Corner and Side Edge Routing
The BridgeEdge routing engine SHALL calculate anchor coordinates for all 8 handle positions including corners (top-left, top-right, bottom-left, bottom-right) and sides (left, right), producing clean orthogonal paths that do not overlap node borders.

#### Scenario: Routing orthogonal edge from corner handle
- **WHEN** an edge originates from a corner handle such as top-right
- **THEN** the edge path starts exactly from the corner vertex coordinate and routes with clean orthogonal 90-degree bend segments
