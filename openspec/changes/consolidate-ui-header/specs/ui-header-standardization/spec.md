## ADDED Requirements

### Requirement: Global Header Standardization
The application SHALL utilize a single, standardized global header (`MainHeader`) as the primary container for global actions, including user profile management and interactive notifications.

#### Scenario: Unified header visibility
- **WHEN** user navigates to any protected route (Dashboard, Scoping, etc.)
- **THEN** the same `MainHeader` component SHALL be visible at the top of the viewport.

### Requirement: Theme Locking to Blue Classic
The system SHALL exclusively render the "Blue (Classic)" light theme across all components and pages, regardless of previous user settings or system preferences.

#### Scenario: Theme persistence
- **WHEN** a user logs in or refreshes the page
- **THEN** the application SHALL always load with the blue header and light background palette.

### Requirement: Removal of Theme Toggle
The system SHALL NOT provide any UI controls to the user for switching between dark and light themes.

#### Scenario: Absence of theme toggle
- **WHEN** user views the `MainHeader` or profile menu
- **THEN** no theme switcher or dark mode toggle SHALL be present.
