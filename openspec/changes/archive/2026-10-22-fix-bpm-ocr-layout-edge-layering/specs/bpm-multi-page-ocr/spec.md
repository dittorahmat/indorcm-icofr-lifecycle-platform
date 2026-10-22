# Spec Delta

## ADDED Requirements

### Requirement: Dynamic Swimlane Width Based on Parallel Branching
The OCR layout engine SHALL dynamically compute swimlane widths based on the maximum number of concurrent/parallel nodes positioned within any single rank of that swimlane.

#### Scenario: Single vertical flow in swimlane
- **WHEN** all nodes in a swimlane follow a single sequential chain
- **THEN** the swimlane width SHALL be sized to standard minimum width accommodating a single node column

#### Scenario: Multiple parallel nodes in a swimlane rank
- **WHEN** a swimlane contains two or more sibling nodes sharing the same topological rank
- **THEN** the swimlane width MUST expand proportionally to accommodate all concurrent nodes side-by-side with clear separation

### Requirement: Anti-Clumping Clearance in OCR Layout
The OCR layout engine SHALL enforce sufficient vertical and horizontal clearance between adjacent nodes to prevent visual overlap.

#### Scenario: Sequential nodes within swimlane
- **WHEN** sequential nodes are arranged vertically in a lane
- **THEN** the vertical spacing between the bottom of a predecessor node and the top of a successor node MUST maintain a minimum clearance of at least 40px

#### Scenario: Sibling nodes in the same rank
- **WHEN** multiple nodes are placed in the same rank within a swimlane
- **THEN** the horizontal clearance between adjacent sibling nodes MUST maintain a minimum separation of at least 40px
