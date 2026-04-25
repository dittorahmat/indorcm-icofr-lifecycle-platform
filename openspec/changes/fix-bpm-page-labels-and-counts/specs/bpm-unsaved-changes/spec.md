## ADDED Requirements

### Requirement: BPM Page Unsaved Changes Warning
The BPM Page SHALL warn users when they attempt to navigate away with unsaved changes to account assertions.

#### Scenario: Navigate with unsaved assertions
- **WHEN** a user modifies account assertions in the BPM Page
- **AND** attempts to navigate to another page without saving
- **THEN** the system MUST display a confirmation dialog warning about data loss.

### Requirement: Standardized FSLI Label
The BPM Page SHALL use the term "FSLI" (appropriately localized) for the FSLI selection dropdown, distinct from the scoping terminology.

#### Scenario: View BPM Page in Indonesian
- **WHEN** the user sets language to Indonesian and views the BPM Page
- **THEN** the label for the first dropdown MUST be "FSLI".

#### Scenario: View BPM Page in English
- **WHEN** the user sets language to English and views the BPM Page
- **THEN** the label for the first dropdown MUST be "FSLI".
