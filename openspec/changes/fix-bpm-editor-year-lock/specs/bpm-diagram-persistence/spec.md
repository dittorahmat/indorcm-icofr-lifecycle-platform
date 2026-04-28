## ADDED Requirements

### Requirement: BPM Diagram Metadata Persistence
The system SHALL ensure that BPM diagrams are persisted with their associated `year` and `subProcess` metadata upon both creation and update.

#### Scenario: Creation of a new diagram
- **WHEN** the user creates a new BPM diagram for a specific sub-process and fiscal year
- **THEN** the system SHALL store the `id`, `name`, `subProcess`, `year`, and an empty `nodes` array in the database

#### Scenario: Updating an existing diagram
- **WHEN** the user saves changes to an existing BPM diagram
- **THEN** the system SHALL persist the updated `nodes`, `edges`, `name`, `subProcess`, and `year` in the database, ensuring no metadata is lost

### Requirement: Default Node Initialization
The system SHALL initialize new, empty BPM diagrams with a default "Mulai" (Start) node in the editor.

#### Scenario: Opening a newly created diagram
- **WHEN** the user opens a BPM diagram that has no nodes saved in the database
- **THEN** the editor SHALL render a default "Mulai" node as the starting point for the user
