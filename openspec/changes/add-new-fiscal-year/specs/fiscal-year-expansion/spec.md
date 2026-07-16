## ADDED Requirements

### Requirement: Custom Fiscal Year Addition Trigger
The fiscal year selector dropdown SHALL include a "+ Tambah Tahun Baru" (or localized equivalent) option that allows users to initiate the addition of a custom fiscal year.

#### Scenario: Displaying the add custom year option
- **WHEN** the user opens the fiscal year dropdown menu
- **THEN** the dropdown menu displays the standard dynamic year options and a "+ Tambah Tahun Baru" action item at the bottom

#### Scenario: Opening the add year confirmation modal
- **WHEN** the user clicks the "+ Tambah Tahun Baru" option
- **THEN** the system displays a confirmation dialog/modal requesting the user to confirm the addition of the new fiscal year

### Requirement: Fiscal Year Validation and Addition
The system SHALL validate that the entered/confirmed year is a valid 4-digit number and has not already been added, and then append it to the available fiscal years list.

#### Scenario: Adding a valid new fiscal year
- **WHEN** the user inputs or confirms a valid new fiscal year (e.g., 2028) that is not in the list and clicks "Tambah"
- **THEN** the system adds the new year to the list, updates the working year store, sets the current working year to the new year, and closes the dialog

### Requirement: Persistence of Custom Fiscal Years
The list of custom added fiscal years MUST be persisted across browser sessions via local storage and synchronized across open browser tabs.

#### Scenario: Persisting added years across reloads
- **WHEN** the user adds a new fiscal year (e.g., 2028) and reloads the page
- **THEN** the custom year (2028) remains available in the dropdown selector list
