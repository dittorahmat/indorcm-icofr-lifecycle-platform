## ADDED Requirements

### Requirement: FSLI-Level Scoping Calculation
The system SHALL ensure that qualitative assessments on FSLIs are applied consistently to their child GL accounts, preventing scope leakage where non-material child accounts are incorrectly marked significant.

### Requirement: Mandatory Significance Override
The system SHALL always mark specific FSLIs (e.g., "Kas dan Setara Kas") as significant regardless of current materiality thresholds, due to their inherent risk profile.

#### Scenario: FSLI-Level Significance Propagation
- **WHEN** a user assesses an FSLI group as High risk
- **THEN** all associated GL accounts under that FSLI group MUST inherit the significant status for the scoping exercise
- **AND** the system SHALL NOT mark non-material GL accounts as significant purely based on individual FSLI group markers.

#### Scenario: Mandatory FSLI Significance
- **WHEN** a scoping simulation is initialized
- **THEN** FSLIs defined in the `MANDATORY_FSLIS` configuration list MUST be marked as significant
- **AND** they MUST be present in the dropdown selection on the BPM page.

#### Scenario: Data Cleanup Maintenance
- **WHEN** the system maintenance script is executed
- **THEN** it MUST remove entries in `significantAccounts` that no longer meet the established significance criteria based on the new logic
