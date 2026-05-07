## ADDED Requirements

### Requirement: Unified Unsaved Changes Warning
The system SHALL ensure that all critical data-entry pages (Scoping, BPM, RCM, CSA) implement the `useUnsavedChanges` hook to prevent accidental data loss.

#### Scenario: Navigating away from Scoping Editor with unsaved changes
- **WHEN** the user modifies materiality benchmarks and attempts to click "Back" or a Sidebar link without saving
- **THEN** the system SHALL display the `UnsavedChangesDialog` and block navigation until a choice is made

### Requirement: Modal Persistence Protection
The system SHALL warn users when they attempt to close a complex data-entry modal (e.g., Control Editor, BPM Worksheet) with unsaved changes.

#### Scenario: Closing Control Editor modal with unsaved changes
- **WHEN** the user has edited control descriptions in the modal and clicks the "X" or outside the modal
- **THEN** the system SHALL prompt the user to confirm discarding changes if the underlying state is "dirty"
