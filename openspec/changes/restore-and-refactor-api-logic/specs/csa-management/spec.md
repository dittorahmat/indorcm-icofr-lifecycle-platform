## MODIFIED Requirements

### Requirement: CSA Record Sign-off Workflow
The system MUST validate forensic data presence during sign-off and reset schedule status upon deletion.

#### Scenario: CSA deletion resets schedule
- **WHEN** user deletes a signed-off CSA record
- **THEN** system deletes associated samples, the record itself, and resets the associated schedule to 'Not Started'
