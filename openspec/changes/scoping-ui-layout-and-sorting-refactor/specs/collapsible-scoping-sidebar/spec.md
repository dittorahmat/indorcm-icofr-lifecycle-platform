## ADDED Requirements

### Requirement: Collapsible Parameters Panel
The system SHALL provide a left-side panel for Scoping Parameters (OM, PM, Haircut) that can be collapsed to maximize the visibility of the data grid.

#### Scenario: Collapsing the sidebar
- **WHEN** user clicks the collapse toggle button
- **THEN** the parameters panel SHALL slide out of view to the left
- **AND** the data grid SHALL expand to fill the remaining horizontal space

#### Scenario: Expanding the sidebar
- **WHEN** user clicks the expand toggle button while collapsed
- **THEN** the parameters panel SHALL slide back into view from the left
- **AND** the data grid SHALL shrink to accommodate the panel
