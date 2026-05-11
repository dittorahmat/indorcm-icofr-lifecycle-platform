## MODIFIED Requirements

### Requirement: Standardized isDirty Detection
The system SHALL provide a standardized way to define the "dirty" state for various components, including forms, interactive diagrams, and data grids, ensuring specific integration for Scoping Page calculations and BPM Editor node properties.

#### Scenario: Form modification detection
- **WHEN** a user types in a protected form field
- **THEN** the isDirty state for that page becomes true

#### Scenario: Diagram modification detection
- **WHEN** a user moves a node, adds an edge, or modifies node properties in the BPM Editor
- **THEN** the isDirty state for the BPM Editor becomes true

#### Scenario: Scoping calculation modification detection
- **WHEN** a user modifies a qualitative assessment level or a materiality parameter (OM/PM percentage) in the Scoping Page
- **THEN** the isDirty state for the Scoping Page becomes true
