## MODIFIED Requirements

### Requirement: Global Notification Center
The system SHALL provide a global notification center accessible via a bell icon in the main layout header, featuring a real-time unread count and a dropdown list of recent alerts.

#### Scenario: Unread notifications badge
- **WHEN** user has 5 unread notifications
- **THEN** the bell icon SHALL display a red badge with the number "5"

#### Scenario: Interactive Notification Dropdown
- **WHEN** user clicks the notification bell icon
- **THEN** a dropdown SHALL appear showing the most recent notifications with 'Mark as Read' functionality
