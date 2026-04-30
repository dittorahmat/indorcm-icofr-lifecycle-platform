## ADDED Requirements

### Requirement: Multi-Department Owner Selection
The system SHALL allow users (Admin or Line 2) to select one or more departments as owners for a specific account in the GL Scoping worksheet.

#### Scenario: Selecting multiple departments
- **WHEN** the user clicks on the "Lini 1 Owner" field for an account
- **THEN** a multi-select dropdown appears listing all available departments
- **WHEN** the user selects multiple departments and closes the dropdown
- **THEN** the selected departments are displayed as badges or a comma-separated list in the grid cell

### Requirement: Persistent Storage of Multi-Department Assignments
The system SHALL store multiple department IDs for each account assignment and persist them across sessions.

#### Scenario: Saving and reloading assignments
- **WHEN** the user clicks "Save Draft" after assigning multiple departments to several accounts
- **THEN** the system sends the array of department IDs to the backend and saves them in the database
- **WHEN** the user reloads the page
- **THEN** the previously selected departments for each account are correctly displayed in the worksheet

### Requirement: Unsaved Changes Awareness for Department Assignments
The system SHALL track changes to department assignments and treat them as unsaved changes.

#### Scenario: Navigating away with unsaved assignments
- **WHEN** the user modifies a department assignment for any account
- **THEN** the worksheet state is marked as "dirty"
- **WHEN** the user attempts to navigate away without clicking "Save Draft"
- **THEN** the system displays a confirmation dialog warning about unsaved changes
