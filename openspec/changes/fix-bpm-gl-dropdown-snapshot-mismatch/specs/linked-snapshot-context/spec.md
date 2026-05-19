## ADDED Requirements

### Requirement: Simulation-Linked Snapshot Resolution
The system SHALL resolve the specific GL Snapshot used during the creation of a Materiality Simulation using its `glSnapshotId`.

#### Scenario: Resolve linked snapshot successfully
- **WHEN** a simulation with a valid `glSnapshotId` is loaded
- **THEN** the system fetches and uses that specific snapshot for data mapping

### Requirement: Fallback to Active Snapshot
The system SHALL fallback to the globally active GL Snapshot if a simulation's `glSnapshotId` is null.

#### Scenario: Legacy simulation fallback
- **WHEN** a legacy simulation with a null `glSnapshotId` is loaded
- **THEN** the system fetches and uses the current globally active snapshot

### Requirement: Handle Missing Linked Snapshot
The system SHALL display an appropriate error message or state if the linked snapshot for a simulation cannot be found (e.g., if it was deleted).

#### Scenario: Linked snapshot not found
- **WHEN** the system attempts to fetch a snapshot by ID and receiving a 404 error
- **THEN** the system informs the user that the source data for this simulation is missing and suggests re-scoping