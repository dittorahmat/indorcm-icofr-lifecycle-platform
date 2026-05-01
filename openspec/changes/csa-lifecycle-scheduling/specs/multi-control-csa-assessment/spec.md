## ADDED Requirements

### Requirement: Aggregate sub-process assessment
The system SHALL allow users to verify multiple controls for a single transaction sample in a unified horizontal table.

#### Scenario: Verify all controls for a sample
- **WHEN** user views the CSA Assessment tab for a sub-process with 3 controls
- **THEN** system SHALL render a table with columns for each of the 3 controls

### Requirement: Zero Tolerance Enforcement
The system SHALL automatically propose an "Ineffective" status if any control check-point fails in any sample.

#### Scenario: One check-point fails
- **WHEN** user marks one control as "Not Implemented" (❌) for any sample row
- **THEN** system SHALL suggest the final assessment result as "Ineffective"
