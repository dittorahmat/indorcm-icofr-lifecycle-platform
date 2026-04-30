## ADDED Requirements

### Requirement: Delayed RCM ID Generation
The system SHALL NOT assign a unique RCM ID (R-xxx or C-xxx) to a node until the user enters data into the Property Sheet.

#### Scenario: Dropping a node on canvas
- **WHEN** user drags a node onto the canvas
- **THEN** its internal RCM metadata MUST remain empty/null.

#### Scenario: First data entry
- **WHEN** user opens Property Sheet for a node and enters a Risk/Control description
- **THEN** system MUST generate and assign a unique ID from the sequence.
