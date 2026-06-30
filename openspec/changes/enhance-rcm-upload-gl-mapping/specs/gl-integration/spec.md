## ADDED Requirements

### Requirement: TLC RCM Ingestion GL Mapping
The RCM TLC upload template and parser SHALL support parsing a `No_GL` (or `noGL`) column from the CSV/Excel file, representing the General Ledger account code. The parser MUST include this value as `accountCode` in the staging row data and pass it to the `/api/migration/finalize` backend endpoint.

#### Scenario: Uploading TLC RCM CSV file with GL codes
- **WHEN** a user uploads a TLC RCM CSV file containing a `No_GL` column
- **THEN** the parser SHALL successfully parse the GL code for each row
- **AND** include it in the staging table and backend payload as `accountCode`
