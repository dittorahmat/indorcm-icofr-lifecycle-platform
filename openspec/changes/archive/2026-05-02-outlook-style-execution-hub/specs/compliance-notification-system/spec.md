## ADDED Requirements

### Requirement: Global Notification Center
The system SHALL provide a global notification center accessible via a bell icon in the main layout header.

#### Scenario: Unread notifications badge
- **WHEN** user has 5 unread notifications
- **THEN** the bell icon SHALL display a red badge with the number "5"

### Requirement: Deadlines and Reminders Storage
The system SHALL store and retrieve notifications specifically for compliance deadlines and user-configured reminders.

#### Scenario: Viewing notification list
- **WHEN** user clicks the notification bell
- **THEN** system SHALL display a scrollable list of the latest 20 notifications with links to the relevant activities

### Requirement: Notification Triggering
The system SHALL trigger a notification entry when a scheduled activity reaches its configured reminder interval.

#### Scenario: Reminder alert
- **WHEN** a CSA schedule is configured for a "1 hour" reminder and the current time is 1 hour before the planned date
- **THEN** system SHALL generate a notification for the assigned user
