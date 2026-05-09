## MODIFIED Requirements

### Requirement: Scoping Management and Oversight
The system MUST ensure integrity and accountability in the ICOFR scoping process by strictly aligning significant account scoping with materiality and risk criteria.

#### Scenario: Enforced Scoping Consistency
- **WHEN** a simulation is submitted for approval
- **THEN** the system MUST validate that the `significantAccounts` list correctly reflects FSLI-level assessment.
- **AND** the system SHALL block approval if scoping inconsistencies are detected in the `significantAccounts` collection.
