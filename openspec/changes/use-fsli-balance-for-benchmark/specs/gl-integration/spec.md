## ADDED Requirements

### Requirement: FSLI Balance Extraction
The system SHALL detect and extract the `FSLI_Balance` column (and its variants like `FSLIBalance`) from uploaded General Ledger files (Excel/CSV).

#### Scenario: Successful extraction of FSLI Balance
- **WHEN** a user uploads an Excel file containing a column "FSLI_Balance" with value 8910795779934
- **THEN** the system SHALL parse this value and store it in the `fsliBalance` field for each corresponding GL row

### Requirement: FSLI-Level Benchmark Calculation
The system SHALL use the `fsliBalance` value from a representative row in each FSLI group as the total balance for benchmark selection, rather than calculating a sum of individual `balance` fields.

#### Scenario: Displaying benchmark total for FSLI with zero account balances
- **WHEN** a user views the Set Benchmark modal for an FSLI where all individual account balances are 0 but `fsliBalance` is 100,000,000
- **THEN** the system SHALL display "Rp 100.000.000" as the total balance for that FSLI
- **AND** this value SHALL be used for all materiality and scoping threshold calculations
