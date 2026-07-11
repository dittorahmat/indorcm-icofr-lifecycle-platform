## ADDED Requirements

### Requirement: Enforced Change Categorization on Approval
The system's RCM/BPM change approval workflow SHALL enforce the categorization of modifications before they are active in the RCM and reflected in the lifecycle metrics.

#### Scenario: Enforcing categorization during Lini 2 approval
- **WHEN** a Lini 2 user reviews a pending change request
- **THEN** the system SHALL allow editing the effective date and verification categories
- **AND** it SHALL prevent final approval unless a valid change category is specified and logged
