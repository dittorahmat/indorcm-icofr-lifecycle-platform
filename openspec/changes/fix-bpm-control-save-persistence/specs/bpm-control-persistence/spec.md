## ADDED Requirements

### Requirement: Persistence of Dynamically Added Controls
The system SHALL persist all Risk-Control mappings created within the BPM Editor to the database, including those added manually via the "Add Control" action.

#### Scenario: Successfully saving a manually added control
- **WHEN** user adds a new control to an existing risk group in the Regulatory Property Sheet
- **AND** user clicks "Save & Sync"
- **THEN** the system SHALL save the new control to the `controls` table
- **AND** it SHALL create a mapping in the `rcm_controls` table linked to the corresponding risk

### Requirement: Immediate Stable ID Assignment for Controls
The system SHALL assign a unique, permanent control ID (prefixed with `C-`) to a control the moment it is created in the frontend UI.

#### Scenario: Assigning ID on creation
- **WHEN** user clicks "Add Control" in the Regulatory Property Sheet
- **THEN** the system SHALL immediately generate a unique ID (e.g., "C-8digit")
- **AND** it SHALL assign this ID to the `controlId` property of the new control pair
