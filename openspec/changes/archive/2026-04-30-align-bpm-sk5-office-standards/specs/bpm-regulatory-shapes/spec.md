## ADDED Requirements

### Requirement: Regulatory Inverted Triangle for Archive
The system SHALL use an inverted triangle (▽) shape for "Archive" nodes as per SK-5 Lampiran 3.

#### Scenario: Dragging an Archive node
- **WHEN** user drags "Archive" from the palette
- **THEN** system renders an inverted triangle node with "ARSIP" label.

### Requirement: Double-Lined Rectangle for External Process
The system SHALL provide a double-lined rectangle node type for "Connection to/from separate processes".

#### Scenario: Creating a separate process connection
- **WHEN** user selects "External Process" node
- **THEN** system renders a rectangle with internal double border.

### Requirement: Slanted Top Rectangle for Manual Input
The system SHALL provide a slanted top rectangle node type for manual data entry steps, matching MS Office/Visio standards.

#### Scenario: Creating a manual input node
- **WHEN** user selects "Manual Input" node
- **THEN** system renders a node with a slanted top edge (keyboard-like).

### Requirement: Pentagon/Chevron for Off-page Reference
The system SHALL provide a pentagon or chevron shape for off-page references to other diagrams.

#### Scenario: Adding off-page reference
- **WHEN** user selects "Off-page Ref"
- **THEN** system renders a pentagon shape (home-like).

### Requirement: Cylinder for Data Storage Media Only
The cylinder shape SHALL be restricted to "Sistem as data transfer/storage media" without processing logic, as per SK-5 Page 91.

#### Scenario: Differentiating System Process vs Media
- **WHEN** user adds "System Process"
- **THEN** it MUST be a blue rectangle.
- **WHEN** user adds "Data Media"
- **THEN** it MUST be a cylinder.
