## ADDED Requirements

### Requirement: Enforce Granular Verification
The system SHALL ensure that a CSA assessment can only be marked as 'Effective' if all granular verification points (Transaction x Control) have been verified and documented.

#### Scenario: Validation during sign-off
- **WHEN** the user attempts to sign-off a CSA as Effective
- **THEN** the system SHALL check if every verification point has attached evidence and an 'Implemented' status
- **AND** it SHALL block the sign-off if any point is missing documentation or has failed the test
