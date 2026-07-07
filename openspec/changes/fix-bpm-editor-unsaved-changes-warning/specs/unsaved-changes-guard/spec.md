## ADDED Requirements

### Requirement: BPM Dialog Closing Warning
The system SHALL intercept attempts to close the BPM Editor dialog (either through close buttons or overlay/escape key dismissals) when there are unsaved changes on the canvas and ask for user confirmation.

#### Scenario: User attempts to close the BPM Editor dialog with unsaved changes
- **WHEN** there are unsaved changes in the diagram (isDirty is true) and the user attempts to close the dialog
- **THEN** the system displays a confirmation prompt asking whether they want to discard changes
