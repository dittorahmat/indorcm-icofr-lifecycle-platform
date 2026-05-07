## MODIFIED Requirements

### Requirement: Global Notification Center
The system SHALL provide a global notification center accessible via a bell icon in the main layout header, which SHALL be visible on all pages.

#### Scenario: Unread notifications badge
- **WHEN** user has 5 unread notifications
- **THEN** the bell icon SHALL display a red badge with the number "5"

### Requirement: Viewing notification list
The system SHALL display a scrollable list of notifications when the bell icon is clicked, allowing users to quickly jump to the relevant activity.

#### Scenario: Viewing notification list
- **WHEN** user clicks the notification bell
- **THEN** system SHALL display a scrollable list of the latest 20 notifications with links to the relevant activities
