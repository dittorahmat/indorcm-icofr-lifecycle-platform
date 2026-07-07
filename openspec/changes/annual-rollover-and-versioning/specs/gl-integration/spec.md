## ADDED Requirements

### Requirement: Year-based Account Assertions
The system MUST partition qualitative account assertions (`account_assertions` table) by fiscal year.

#### Scenario: Save qualitative assertions for a specific year
- **WHEN** user updates the qualitative assertions for an account in year 2025
- **THEN** system SHALL save it under year 2025 and ensure year 2024 assertions for the same account remain unchanged
