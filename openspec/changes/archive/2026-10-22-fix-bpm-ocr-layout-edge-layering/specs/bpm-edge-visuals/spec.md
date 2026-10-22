# Spec Delta

## ADDED Requirements

### Requirement: Edge Layer Elevation Above Nodes
The BPM canvas SHALL render edge connection paths and arrowheads above node bodies in the stacking context so that connection paths and directional arrows are not obscured by node backgrounds.

#### Scenario: Edge connecting to target node
- **WHEN** an edge connects into a target node or passes near another node
- **THEN** the edge path and its arrowhead marker MUST remain visible above the node's background surface

#### Scenario: Edge marker rendering at target border
- **WHEN** an edge reaches the target node's handle
- **THEN** the arrowhead marker MUST terminate cleanly at the node's perimeter without being occluded by the node's internal background fill
