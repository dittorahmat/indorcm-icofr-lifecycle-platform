## ADDED Requirements

### Requirement: Corporate Master COA Mapping
The system SHALL support mapping local GL accounts from various subsidiaries to a single standardized Corporate Chart of Accounts (COA).

#### Scenario: AI-assisted multi-entity GL mapping
- **WHEN** user uploads a Trial Balance containing multiple `entityCode` values
- **THEN** system SHALL use semantic matching to suggest mapping for each account to the Corporate standard
- **AND** it SHALL display a confidence score for each mapping.

### Requirement: Entity-Based Account Validation
The system SHALL validate the significance of accounts (Quantitative vs Qualitative) at both the subsidiary level and the consolidated group level.

#### Scenario: Detecting entity-specific significant accounts
- **WHEN** an account balance in a specific subsidiary exceeds that entity's PM threshold
- **THEN** AI SHALL automatically flag it as `Significant` for that entity.
