## ADDED Requirements

### Requirement: Form Dirty State Tracking
The system SHALL provide a way to track if a form has unsaved changes.

#### Scenario: Form becomes dirty
- **WHEN** user types in an input field of a tracked form
- **THEN** the system sets the form state to "dirty"

### Requirement: Navigation Guard
The system SHALL prevent the user from navigating away from a dirty form without confirmation.

#### Scenario: User navigates with unsaved changes
- **WHEN** user clicks a sidebar link while a form is "dirty"
- **THEN** the system shows a confirmation dialog: "You have unsaved changes. Are you sure you want to leave?"

#### Scenario: User confirms navigation
- **WHEN** user clicks "Leave" in the confirmation dialog
- **THEN** the system discards changes and proceeds to the new route

#### Scenario: User cancels navigation
- **WHEN** user clicks "Stay" in the confirmation dialog
- **THEN** the system remains on the current page with changes preserved

### Requirement: Browser Tab Close Protection
The system SHALL trigger the browser's native beforeunload warning if there are unsaved changes.

#### Scenario: User closes tab with dirty form
- **WHEN** user attempts to close the browser tab or window while form is "dirty"
- **THEN** the browser displays its native "Leave site?" warning
