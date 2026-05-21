## ADDED Requirements

### Requirement: Migration Baseline Entry Point
The system SHALL treat the finalization of a data migration as a valid starting point for the regulatory lifecycle, bypassing individual stage-gate approvals for historical data.

#### Scenario: Registering migration in audit trail
- **WHEN** a user finalizes a migration
- **THEN** system SHALL create an audit log entry with `action: MIGRATION_BASELINE`
- **AND** it SHALL mark the entry as `isRegulatory: true` to satisfy Lampiran 6 documentation requirements.
