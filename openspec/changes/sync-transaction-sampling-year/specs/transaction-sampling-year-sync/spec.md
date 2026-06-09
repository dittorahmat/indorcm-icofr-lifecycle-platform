## ADDED Requirements

### Requirement: Global Fiscal Year Synchronization
The Transaction Sampling display SHALL automatically filter and display only transactions whose `transDate` year matches the globally selected `workingYear` from the system's fiscal year store.

#### Scenario: Switching fiscal year updates display
- **WHEN** the user changes the global fiscal year to 2026
- **THEN** the Transaction Sampling table only shows rows with transaction dates in 2026

### Requirement: API Support for Year Filtering
The `GET /api/transaction-details` endpoint SHALL support an optional `year` query parameter to filter results by transaction date year on the server side.

#### Scenario: Fetching transactions for a specific year
- **WHEN** a request is made to `/api/transaction-details?noGL=123&year=2026`
- **THEN** the API returns only transactions for GL 123 that occurred in 2026

### Requirement: Robust Batch Transaction Upload
The transaction upload system SHALL support processing an array of transaction rows in a single request and correctly handle `replace` (clear existing for GL) or `append` (add to existing) modes.

#### Scenario: Batch upload in replace mode
- **WHEN** the user uploads a file with 100 rows in "Replace" mode
- **THEN** the system deletes all existing transactions for that GL and inserts the 100 new rows
