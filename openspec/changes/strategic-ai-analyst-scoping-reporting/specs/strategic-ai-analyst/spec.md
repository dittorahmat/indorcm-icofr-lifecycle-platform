## ADDED Requirements

### Requirement: Cross-Module Reasoning
The system SHALL enable the AI to perform queries that join financial materiality data (Scoping) with operational effectiveness data (Testing).

#### Scenario: Identifying high-risk significant accounts
- **WHEN** user asks "Which significant accounts have ineffective controls?"
- **THEN** the AI SHALL correlate the list of accounts from `gl_rows` (marked as significant) with the `test_records` status
- **AND** return a prioritized list of accounts and their associated failing controls.

### Requirement: Executive Summary Generation
The system SHALL provide an executive summary tool that aggregates OM/PM thresholds and deficiency levels.

#### Scenario: Generating executive snapshot
- **WHEN** a Line 2 user asks for an "Executive Summary"
- **THEN** the AI SHALL retrieve active materiality values from `simulations` and severity counts from `deficiencies`
- **AND** provide a summarized text report of the current ICOFR health.
