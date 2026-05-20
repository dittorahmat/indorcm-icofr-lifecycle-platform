# csa-todo-calendar-sync Specification

## Purpose
TBD - created by archiving change sync-todo-calendar-activity-names. Update Purpose after archive.
## Requirements
### Requirement: Free-text Activity Detail Input
The system SHALL provide a free-text input field labeled "Detail Activity" in the activity scheduling and editing dialogs to allow users to enter custom activity descriptions.

#### Scenario: User enters custom activity description
- **WHEN** the user opens the "New Event" or "Edit Details" dialog
- **THEN** a "Detail Activity" text input is visible instead of the "Sub Process" dropdown
- **WHEN** the user types "Weekly Review" into the field and saves
- **THEN** the activity is stored with "Weekly Review" as its description

### Requirement: Unified Activity Name Display
The system SHALL display the custom activity description consistently in both the Todo list (sidebar) and the Calendar grid.

#### Scenario: Display custom name in Calendar
- **WHEN** an activity has a custom description "Monthly Closing"
- **THEN** the Calendar grid cell for that date SHALL display "Monthly Closing" as the event title

#### Scenario: Display custom name in Todo List
- **WHEN** an activity has a custom description "Monthly Closing"
- **THEN** the Sidebar Todo list item for that date SHALL display "Monthly Closing" as the activity title

