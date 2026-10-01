# Spec Delta

## ADDED Requirements

### Requirement: Automatic Control-Level Deficiency Registration
When a Control Self-Assessment (CSA) record is submitted as Ineffective, the system SHALL evaluate all sample verification results to identify each distinct control that failed verification (`implemented === false`), and automatically generate a corresponding deficiency linked directly to that specific control ID.

#### Scenario: Ineffective BPM CSA with multiple failed controls
- **WHEN** user submits a CSA assessment with result `Ineffective` containing samples where controls C1 and C2 failed (`implemented === false`) and control C3 passed (`implemented === true`)
- **THEN** system SHALL create an open deficiency for control C1 with source `Lini 1 - CSA`
- **AND** system SHALL create an open deficiency for control C2 with source `Lini 1 - CSA`
- **AND** system SHALL NOT create a deficiency for control C3

#### Scenario: Fallback when no granular control failure is found
- **WHEN** user submits a CSA assessment with result `Ineffective` but no sample control results contain `implemented === false`
- **THEN** system SHALL create a single process-level deficiency associated with the assessment period
