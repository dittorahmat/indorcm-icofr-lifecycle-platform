## ADDED Requirements

### Requirement: WYSIWYG Export Edge Fidelity
The system SHALL render BPM edges in exported documents (PDF/PNG via Document View) with the same path geometry, markers, and style as the editor canvas.

#### Scenario: Orthogonal path preserved in export
- **WHEN** a diagram with orthogonal Manhattan edges and bridge arcs is exported via Print / Export PDF
- **THEN** the exported image MUST show siku 90-degree segments and bridge arcs at crossings, not smooth Bezier curves

#### Scenario: Arrow marker parity
- **WHEN** an edge with a standardized ArrowClosed marker is exported
- **THEN** the exported edge MUST display the same closed triangular marker with matching size and color as in the editor

#### Scenario: Multi-edge distribution preserved
- **WHEN** multiple edges share the same node side in the editor with distributed connection points
- **THEN** the export MUST preserve the same distributed connection points, not collapse them to center
