## ADDED Requirements

### Requirement: Calendar Grid Visualization
The system SHALL display CSA schedules in a full-width monthly grid.

#### Scenario: Visual status of overdue CSA
- **WHEN** a CSA schedule is not completed and its planned date is in the past
- **THEN** it SHALL be displayed with a Red background in the calendar grid

#### Scenario: Visual status of completed CSA
- **WHEN** a CSA schedule status is 'Completed'
- **THEN** it SHALL be displayed with a Green background in the calendar grid
