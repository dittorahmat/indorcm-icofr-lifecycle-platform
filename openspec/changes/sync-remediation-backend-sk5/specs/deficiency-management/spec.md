## ADDED Requirements

### Requirement: Action Plan to Deficiency Sync
The system SHALL automatically synchronize the status of a deficiency based on the status of its associated action plan.

#### Scenario: Sync to Remediated
- **WHEN** an action plan status is updated to "Resolved"
- **THEN** the system SHALL automatically update the parent deficiency status to "Remediated"

#### Scenario: Sync to Verified
- **WHEN** an action plan status is updated to "Verified"
- **THEN** the system SHALL automatically update the parent deficiency status to "Verified"

### Requirement: Regulatory Audit Logging for Remediation
The system SHALL record an audit log entry for every mutation (create/update) of a deficiency or action plan, marking it as a regulatory change.

#### Scenario: Audit Log Entry
- **WHEN** user updates a remediation plan
- **THEN** the system SHALL create an `audit_logs` record with `isRegulatory` set to true and include the data diff
