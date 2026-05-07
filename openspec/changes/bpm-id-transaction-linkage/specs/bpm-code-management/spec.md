## ADDED Requirements

### Requirement: Set Process BPM Code
The system SHALL allow users to define and update a human-readable identifier (BPM Code) for each business process.

#### Scenario: Updating BPM Code in Worksheet
- **WHEN** the user inputs a new value in the "BPM Code" field within the Worksheet tab
- **AND** clicks the "Save" or "Update" button
- **THEN** the system SHALL persist the BPM Code in the database associated with that process

### Requirement: Visibility of BPM Code
The system SHALL display the BPM Code prominently in the Execution Hub header and the BPM overview table.

### Requirement: Enforce Unique BPM Code
The system SHALL ensure that each BPM Code is unique within an organization. It MUST prevent the saving of a code that is already assigned to another process.

#### Scenario: Attempting to save a duplicate BPM Code
- **WHEN** the user inputs a BPM Code that is already in use by another process
- **AND** clicks "Save"
- **THEN** the system SHALL display a warning message: "BPM Code '[CODE]' sudah digunakan oleh proses lain."
- **AND** it SHALL block the update in the database.
