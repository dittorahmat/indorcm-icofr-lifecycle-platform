# unsaved-changes-guard Specification

## Purpose
TBD - created by archiving change implement-unsaved-changes-warning. Update Purpose after archive.
## Requirements
### Requirement: Internal Navigation Warning
The system SHALL intercept internal route changes when there are unsaved changes on the current page and prompt the user for confirmation before proceeding.

#### Scenario: User navigates away from dirty page via sidebar
- **WHEN** the user has modified data (isDirty is true) and clicks a link in the sidebar
- **THEN** the system blocks the navigation and displays a confirmation dialog

#### Scenario: User confirms navigation
- **WHEN** the user clicks "Yes, discard changes" in the confirmation dialog
- **THEN** the system proceeds with the navigation to the new route

#### Scenario: User cancels navigation
- **WHEN** the user clicks "Cancel" in the confirmation dialog
- **THEN** the system remains on the current page and the navigation is aborted

### Requirement: External Navigation Warning
The system SHALL alert the user using the browser's native confirmation dialog when they attempt to close the tab, refresh the page, or navigate to an external URL while there are unsaved changes.

#### Scenario: User refreshes the page with unsaved changes
- **WHEN** the user has modified data (isDirty is true) and attempts to refresh the page (F5)
- **THEN** the browser displays a native confirmation prompt

#### Scenario: User closes the tab with unsaved changes
- **WHEN** the user has modified data (isDirty is true) and attempts to close the browser tab
- **THEN** the browser displays a native confirmation prompt

### Requirement: Standardized isDirty Detection
The system SHALL provide a standardized way to define the "dirty" state for various components, including forms, interactive diagrams, and data grids.

#### Scenario: Form modification detection
- **WHEN** a user types in a protected form field
- **THEN** the isDirty state for that page becomes true

#### Scenario: Diagram modification detection
- **WHEN** a user moves a node or adds an edge in the BPM Editor
- **THEN** the isDirty state for the BPM Editor becomes true

