## MODIFIED Requirements

### Requirement: Unsaved Changes Protection on Regulatory Forms
The system SHALL display a confirmation warning when a user attempts to navigate away from the TOD/TOE sampling grid or RCM editing sheet with unsaved changes.

#### Scenario: Navigating away with dirty sampling grid
- **WHEN** a user has modified rows in the sampling grid and clicks a sidebar link
- **THEN** the system interrupts navigation with a "Discard unsaved changes?" dialog
