## MODIFIED Requirements

### Requirement: Standardized isDirty Detection
The system SHALL provide a standardized way to define the "dirty" state for various components, including forms, interactive diagrams, and data grids.

#### Scenario: Form modification detection
- **WHEN** a user types in a protected form field
- **THEN** the isDirty state for that page becomes true

#### Scenario: Diagram modification detection
- **WHEN** a user moves a node or adds an edge in the BPM Editor
- **THEN** the isDirty state for the BPM Editor becomes true

#### Scenario: Locked diagram prevents dirty state
- **WHEN** the BPM Editor is locked
- **THEN** all property sheet inputs SHALL be read-only and no modifications can be made, preventing the isDirty state from becoming true
