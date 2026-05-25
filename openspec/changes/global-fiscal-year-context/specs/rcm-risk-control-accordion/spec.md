## MODIFIED Requirements

### Requirement: RCM Year Context
The RCM Matrix SHALL derive its fiscal year context from the global header selector.

#### Scenario: RCM data synchronization
- **WHEN** global year is set to a historical year (e.g. 2023)
- **THEN** the RCM Matrix SHALL display only controls and risks that were active in that specific year.
