## MODIFIED Requirements

### Requirement: Manual GL Upload
The system SHALL support `.csv` and `.xlsx` files for GL upload, extracting account names and ending balances, and automatically marking accounts as `Significant` if the balance meets or exceeds the Performance Materiality (PM) threshold.

#### Scenario: Successful GL Upload with Significance Marking
- **WHEN** user uploads a valid `.xlsx` file containing account balances
- **THEN** system SHALL parse the data, calculate significance based on current PM, and append the results to the scoping matrix

### Requirement: Drizzle Schema Synchronization
The system SHALL ensure the database schema is synchronized across local and remote environments using `drizzle-kit push` to support rapid structural updates without sequential migration overhead during development.

#### Scenario: Synchronizing database schema
- **WHEN** the developer updates `schema.ts` and runs the sync command
- **THEN** the target database SHALL reflect the new structure immediately
