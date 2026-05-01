## ADDED Requirements

### Requirement: Management of CSA Schedules
The system SHALL provide a centralized calendar interface for managers (Line 1) to create, view, and monitor CSA schedules.

#### Scenario: Create recurring schedule
- **WHEN** manager selects a sub-process and sets frequency to "Monthly"
- **THEN** system SHALL populate the calendar with recurring due dates for that sub-process

### Requirement: Dashboard status tracking
The system SHALL display the status of each scheduled task (Not Started, In Progress, Completed, Overdue) in the calendar.

#### Scenario: View overdue tasks
- **WHEN** a task passes its due date without sign-off
- **THEN** system SHALL mark the task as "Overdue" with a red indicator in the calendar
