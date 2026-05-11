## ADDED Requirements

### Requirement: Database Schema Synchronization
The developer SHALL be able to synchronize the database schema with the application models using Drizzle Kit.

#### Scenario: Running schema push
- **WHEN** the developer runs `npx drizzle-kit push`
- **THEN** the target database schema is updated to match the current TypeScript models

### Requirement: Standardized Localization
The system SHALL ensure that all critical UI strings are externalized in the `src/i18n/` directory and support multi-language fallbacks.

#### Scenario: Accessing missing translation
- **WHEN** the UI requests a translation key that is missing in the current locale
- **THEN** the system displays the key name or falls back to the default English value

### Requirement: Sidebar Link Consistency
The system SHALL ensure the sidebar contains all links to critical ICOFR modules and correctly reflects the current navigation state.

#### Scenario: Navigating via sidebar
- **WHEN** the user clicks a module link in the sidebar
- **THEN** the system navigates to the correct page and highlights the active item

### Requirement: Notification Awareness
The system SHALL provide a visible indicator of unread notifications to the user.

#### Scenario: New notification received
- **WHEN** the system generates a new notification for the user
- **THEN** the NotificationBell displays an updated unread count or a highlight indicator

### Requirement: Standardized API Responses
All backend API routes SHALL use the standardized `ok` and `bad` response utilities to ensure consistent client-side error handling.

#### Scenario: Successful API call
- **WHEN** an API route completes successfully
- **THEN** it returns a response in the format `{ success: true, data: ... }`

#### Scenario: Failed API call
- **WHEN** an API route encounters an error
- **THEN** it returns a response in the format `{ success: false, error: "ERROR_CODE", message: "..." }`
