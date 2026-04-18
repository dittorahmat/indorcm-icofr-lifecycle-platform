## ADDED Requirements

### Requirement: License-Aware Authentication
The system MUST verify that a valid license exists and matches the current machine before allowing any user to create a session.

#### Scenario: Login with invalid license
- **WHEN** a user attempts to log in but the license is invalid or expired
- **THEN** the system SHALL reject the login attempt and redirect to the activation page
