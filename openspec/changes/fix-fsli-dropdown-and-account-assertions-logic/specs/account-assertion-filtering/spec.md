## ADDED Requirements

### Requirement: Granular Account Assertion Query
The system SHALL provide an API endpoint to retrieve Account Assertions filtered by `fsliName` and `noGL` (General Ledger number).

#### Scenario: Fetching assertions for a specific GL account
- **WHEN** the frontend requests `/api/account-assertions?fsliName=Inventory&noGL=120000`
- **THEN** the backend SHALL return exactly one assertion object corresponding to that specific FSLI and GL account combination

### Requirement: Single-Account Assertion Upsert
The system SHALL support an upsert operation for a single Account Assertion record, ensuring that existing records are updated and new records are created correctly for a given GL account within an organization.

#### Scenario: Saving assertion changes
- **WHEN** the user modifies assertions for a GL account and clicks save
- **THEN** the backend SHALL perform an atomic upsert for that specific record in the `account_assertions` table
