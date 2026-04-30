## ADDED Requirements

### Requirement: Universal Risk & Control Mapping
The system SHALL allow users to map Risks and Controls to any node type in the BPM diagram, not just Manual Activities.

#### Scenario: Mapping risk to a decision
- **WHEN** user selects a "Decision" node and opens the Property Sheet
- **THEN** system MUST show the "Risks & Controls" identification section.

### Requirement: Visual Docking Badges for All Nodes
The system SHALL display "Risk/Control Badges" on any node that has associated RCM data.

#### Scenario: Badge visibility
- **WHEN** any node type is saved with linked risks or controls
- **THEN** a Hexagon (Risk) and/or Circle (Control) badge MUST be docked to the node in the editor and viewer.
