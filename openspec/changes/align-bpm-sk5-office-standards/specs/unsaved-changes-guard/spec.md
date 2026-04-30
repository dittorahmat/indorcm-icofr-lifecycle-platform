## ADDED Requirements

### Requirement: Internal Navigation Blockade
The system SHALL intercept internal route changes when there are unsaved changes and display a confirmation dialog.

#### Scenario: Navigating away from BPM Editor
- **WHEN** user has modified a diagram (`isDirty` is true) and clicks a sidebar link
- **THEN** system MUST show a confirmation dialog asking to discard or stay.

### Requirement: External Browser Warning
The system SHALL warn the user when they attempt to refresh, close the tab, or navigate back using browser controls if they have unsaved changes.

#### Scenario: Refreshing the page
- **WHEN** user has unsaved changes
- **THEN** system MUST trigger the native browser "Leave site?" confirmation via `beforeunload`.
