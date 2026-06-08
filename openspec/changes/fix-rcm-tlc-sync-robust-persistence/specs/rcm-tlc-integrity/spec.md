## ADDED Requirements

### Requirement: Temporal Synchronization
The system SHALL ensure that all Risks and Controls created or modified via the BPM Editor inherit the `year` property from the parent BPM Diagram.

#### Scenario: Saving Diagram Updates Risk Year
- **WHEN** a user saves a BPM Diagram for the year 2026
- **THEN** all associated Risks (rcms) SHALL have their `year` field set to 2026, regardless of previous values.

### Requirement: Sub-Process Traceability
Every Control record SHALL maintain an explicit link to a `BPMProcess` record (`bpmProcessId`) that matches the current diagram's `subProcess` name and `year`.

#### Scenario: Control Linkage to BPM Process
- **WHEN** a user saves a BPM Diagram with sub-process name "Penerimaan Kas" for 2026
- **THEN** all associated Controls SHALL be linked to the `bpmProcessId` of the "Penerimaan Kas" process for the year 2026.

### Requirement: Meta-Data Persistence
The system SHALL update the `process` and `subProcess` fields of Risk and Control records whenever the BPM Diagram is saved, ensuring visual labels in the diagram are reflected in the RCM database.

#### Scenario: Saving Diagram Updates Control Metadata
- **WHEN** a user changes the sub-process name in a BPM Diagram from "Old Process" to "New Process" and saves
- **THEN** all associated Risks and Controls SHALL have their `subProcess` field updated to "New Process".

### Requirement: Strict Year Filtering
Tabular views (RCM Matrix) and process selection dropdowns SHALL filter results strictly by the active `year` to prevent data pollution from records with NULL or mismatched years.

#### Scenario: RCM Matrix Filters by Year
- **WHEN** the active fiscal year is set to 2026 and the user views the RCM TLC tab
- **THEN** the system SHALL ONLY display records where the `year` field is exactly 2026.

#### Scenario: BPM Process Dropdown Filters by Year
- **WHEN** the user opens the process selection dropdown in the Scoping or Execution Hub for the year 2026
- **THEN** the system SHALL ONLY display BPM Processes registered for the year 2026.
