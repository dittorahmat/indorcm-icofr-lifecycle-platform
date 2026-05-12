## ADDED Requirements

### Requirement: Global Notification Bell
The application SHALL include a notification bell in the main header/sidebar to display compliance-related alerts.

#### Scenario: Notification alert
- **WHEN** a new notification record is created in the database
- **THEN** the bell icon shows a badge with the unread count

### Requirement: Compliance Event Notifications
The system MUST generate notifications for critical ICOFR events such as "CSA period started", "Remediation target date approaching", and "Test rejected by Line 2".

#### Scenario: CSA notification
- **WHEN** the current date enters the CSA window for a control owner
- **THEN** a notification is automatically sent to that user
