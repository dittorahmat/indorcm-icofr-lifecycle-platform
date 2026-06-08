## ADDED Requirements

### Requirement: Auto-populated Qualitative Factors
Upon creating a new scoping simulation, the system SHALL automatically populate the `assessmentData` with default qualitative ratings from the `scoping-assertions-library` for all unique FSLI names present in the active GL snapshot.

#### Scenario: Simulation initialization
- **WHEN** a user initializes a new scoping simulation (POST /api/simulations)
- **THEN** the system iterates through all unique FSLIs in the active snapshot
- **AND** applies library defaults to the simulation's `assessmentData` before saving
