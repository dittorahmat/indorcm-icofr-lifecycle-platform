## MODIFIED Requirements

### Requirement: Global Notification Center
The system SHALL provide a single global notification center accessible via a bell icon exclusively in the main layout header. No other interactive notification bells SHALL be present in sidebars or page-level headers.

#### Scenario: Unread notifications badge
- **WHEN** user has 5 unread notifications
- **THEN** the bell icon in the `MainHeader` SHALL display a red badge with the number "5"

#### Scenario: Single bell existence
- **WHEN** user navigates through the application (including sidebar and content areas)
- **THEN** exactly one interactive notification bell SHALL be visible (in the header).
