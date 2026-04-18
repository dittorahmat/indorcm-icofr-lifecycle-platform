## ADDED Requirements

### Requirement: Mandatory Activation Screen
The system SHALL redirect unauthenticated or unauthorized users to an activation screen if no valid license is found in the database.

#### Scenario: No license found
- **WHEN** a user visits the root URL and no license is active
- **THEN** the system SHALL display the machine ID and a field to input the license key

### Requirement: Expiry Notification Banner
The system SHALL display a non-intrusive notification banner to all logged-in users starting 90 days before license expiration.

#### Scenario: 90 days remaining
- **WHEN** a user is logged in and the license expires in 90 days or less
- **THEN** a dismissible banner SHALL appear at the top of every page showing the remaining days

### Requirement: Aggressive Expiry Modal
The system SHALL display a persistent modal notification to all logged-in users starting 7 days before license expiration.

#### Scenario: 7 days remaining
- **WHEN** a user is logged in and the license expires in 7 days or less
- **THEN** a non-dismissible (must be manually closed) modal SHALL appear upon initial login or page refresh
