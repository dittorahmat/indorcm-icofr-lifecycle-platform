## ADDED Requirements

### Requirement: Mandatory Fiscal Year in Scoping
The system SHALL require the user to select a Fiscal Year (e.g., 2024, 2025) before initializing a new Materiality Simulation.

#### Scenario: Creating a new simulation
- **WHEN** user clicks "New Simulation" in the Scoping Page
- **THEN** system displays a "Year" input field that defaults to the current year or 2024 for existing data
- **AND** system MUST NOT allow proceeding until a valid year is selected

### Requirement: Year-Based Data Partitioning
The system SHALL associate all BPM Diagrams, RCM Matrices, and Controls with a specific Fiscal Year.

#### Scenario: Listing BPM Diagrams
- **WHEN** user navigates to the BPM Visualization page for Year 2025
- **THEN** system only displays BPM diagrams that are tagged with Year 2025

### Requirement: Carry Forward Logic
The system SHALL provide a mechanism to clone all compliance artifacts (BPM, RCM, Controls) from a previous fiscal year to the current one.

#### Scenario: Initializing Year 2025 from 2024
- **WHEN** user creates the first simulation for 2025
- **AND** data exists for 2024
- **THEN** system SHALL automatically create copies of all 2024 BPMs, RCMs, and Controls for 2025
- **AND** all cloned records MUST have their status reset to "Draft"

### Requirement: Immutable Audit Snapshots
The system SHALL ensure that data associated with a completed/approved fiscal year cannot be modified by standard users.

#### Scenario: Viewing 2024 data in 2025
- **WHEN** user views a BPM diagram from Year 2024 (which is already Approved)
- **THEN** system displays the diagram in Read-Only mode
- **AND** all "Edit" actions MUST be disabled
