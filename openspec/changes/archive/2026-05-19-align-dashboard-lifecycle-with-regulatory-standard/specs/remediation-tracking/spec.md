## ADDED Requirements

### Requirement: Lifecycle Phase Alignment
The system SHALL associate remediation activities primarily with the 'Remediasi' lifecycle stage.

#### Scenario: Remediation status influence on lifecycle
- **WHEN** the system evaluates the overall ICOFR progress
- **THEN** it SHALL use the status of action_plans to determine progress within the 'Remediasi' stage
