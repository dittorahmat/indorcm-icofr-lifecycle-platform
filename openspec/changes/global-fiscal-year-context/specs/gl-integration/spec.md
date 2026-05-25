## MODIFIED Requirements

### Requirement: Scoping Year Context
The Scoping module SHALL derive its fiscal year context from the global header selector instead of a local page-level dropdown.

#### Scenario: Real-time scoping refresh
- **WHEN** global year is changed in the header
- **THEN** the Scoping page SHALL immediately re-fetch simulations and snapshots for the new year.
