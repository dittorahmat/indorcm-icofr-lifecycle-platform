## ADDED Requirements

### Requirement: Custom SMTP Configuration Settings
The system SHALL allow organization administrators to configure, save, and update SMTP settings (including host, port, username, password, sender name, and sender email address) via the organization's settings.

#### Scenario: Saving valid SMTP configuration
- **WHEN** an admin updates and saves SMTP configurations in the organization Settings page
- **THEN** the system SHALL persist the settings in the organization's metadata and display a success toast

### Requirement: Automated Email Notification Dispatch
The system SHALL asynchronously dispatch an email notification to the target user's registered email address when a system notification is triggered.

#### Scenario: Receiving email for a new notification
- **WHEN** a new notification is generated for a user in the system
- **THEN** the system SHALL retrieve the user's email address and send an email containing the notification message and link using the configured SMTP/API provider

### Requirement: Fallback to System Default Email
The system SHALL fallback to the global default SMTP/API configuration when an organization has not configured custom SMTP settings.

#### Scenario: Sending email with system fallback
- **WHEN** a notification is generated and the organization's email settings are not configured
- **THEN** the system SHALL send the email notification using the default system email sender credentials
