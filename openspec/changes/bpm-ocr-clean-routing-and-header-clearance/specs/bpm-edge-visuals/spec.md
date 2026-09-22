## ADDED Requirements

### Requirement: Swimlane Header Clearance
The BPM Editor edge routing system SHALL enforce a strict ceiling boundary so that no connection lines or waypoints intersect, pass through, or overlap swimlane header areas.

#### Scenario: Edge routed above swimlane nodes
- **WHEN** an edge connects nodes across or within swimlanes
- **THEN** all path waypoints and orthogonal segments MUST remain strictly below the swimlane header boundary ($Y \ge \text{swimlaneHeaderY} + \text{headerHeight} + 20\text{px}$)

### Requirement: Parallel Edge Channel Anti-Overlap
The BPM Editor edge routing system SHALL distribute overlapping or collinear orthogonal edge segments across separated parallel gutter channels to prevent coincident overlapping lines.

#### Scenario: Multiple edges crossing between adjacent or distant swimlanes
- **WHEN** two or more edges traverse the same horizontal or vertical corridor
- **THEN** each edge segment MUST be offset into distinct parallel tracks spaced by at least 16px to 24px

#### Scenario: Multi-document connection distribution
- **WHEN** multiple connections exit or enter bundled document nodes
- **THEN** connection points MUST be distributed across distinct handle positions to avoid visual bundling of lines
