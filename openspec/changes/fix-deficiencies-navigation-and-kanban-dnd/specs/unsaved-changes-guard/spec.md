## ADDED Requirements

### Requirement: Non-Disruptive Query Parameter Synchronization
The system SHALL ensure that background synchronization of route query parameters (such as the active fiscal year `?year=...`) does not trigger navigation blocker dialogs or route transition failures when data on the page is not dirty.

#### Scenario: Navigating to page without year query
- **WHEN** user clicks a sidebar link to a page like `/deficiencies` without a `?year=` query parameter and `isDirty` is false
- **THEN** the system SHALL synchronize the URL parameter without interrupting the page render or throwing unexpected routing errors

#### Scenario: Dirty page blocks route query changes
- **WHEN** user has unsaved modifications (`isDirty` is true) and a route transition attempts to alter path or query
- **THEN** the blocker dialog SHALL prompt the user to confirm discarding or keeping changes
