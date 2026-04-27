## ADDED Requirements

### Requirement: Automated Record Cloning
The system SHALL support deep cloning of compliance entities including all their relationships (e.g., Controls linked to RCMs).

#### Scenario: Cloning RCM with Controls
- **WHEN** the Carry Forward trigger is activated for Year 2025
- **THEN** system SHALL create new entries in the `rcms` table for 2025
- **AND** system SHALL create new entries in the `controls` table for 2025
- **AND** system SHALL maintain the many-to-many relationships in the `rcm_controls` table for the new 2025 IDs

### Requirement: Status Reset on Migration
All migrated records MUST have their status set to "Draft" regardless of their status in the source year.

#### Scenario: Verify status after migration
- **WHEN** an "Active" RCM from 2024 is cloned to 2025
- **THEN** the new 2025 RCM MUST have status "Draft"
