## ADDED Requirements

### Requirement: Pure Mathematical Verification
The system SHALL use pure, side-effect-free functions for all materiality and multiplier calculations to allow for exact unit testing against regulatory standards (SK-5).

#### Scenario: Multiplier Calculation
- **WHEN** the number of locations is 5
- **THEN** the system SHALL return the exact multiplier of 1.4 (as per Table 12 of SK-5)

### Requirement: Materiality Derivation
The system SHALL calculate OM (Overall Materiality) and PM (Performance Materiality) using standardized formulas that account for benchmark basis and group multipliers.

#### Scenario: PM Calculation
- **WHEN** OM is 1,000,000 and haircut is 25%
- **THEN** the system SHALL return a PM of 750,000
