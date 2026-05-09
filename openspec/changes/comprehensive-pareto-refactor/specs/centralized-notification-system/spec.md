## ADDED Requirements

### Requirement: Global Notification Center
The system SHALL provide a global notification center accessible via a bell icon in the main layout header to alert users of critical events.

#### Scenario: Real-time notification update
- **WHEN** a background process (e.g., successful migration or simulation approval) completes
- **THEN** a new notification SHALL appear in the notification center without a page refresh

### Requirement: Notification Actionability
The system SHALL allow users to navigate directly to the source of a notification from the notification center list.

#### Scenario: Clicking a notification
- **WHEN** the user clicks a notification about a pending simulation
- **THEN** the system SHALL navigate the user to the simulation approval page
