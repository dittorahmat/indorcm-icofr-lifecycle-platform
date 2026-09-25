## MODIFIED Requirements

### Requirement: Manual GL Upload
The system SHALL support uploading General Ledger (GL) or Trial Balance (TB) data from `.csv` and `.xlsx` files, automatically mark accounts as `Significant` if `balance >= PM`, and append newly uploaded accounts to the scoping matrix. For multi-sheet Excel files, the system SHALL filter out hidden worksheets (`Hidden: 1` or `veryHidden: 2`), automatically detect and parse the visible worksheet matching mandatory GL headers, and provide a sheet selection fallback prompt if multiple valid candidate sheets exist or no sheet is definitively identified.

#### Scenario: Single visible valid sheet in multi-sheet Excel
- **WHEN** user uploads an Excel file with a hidden sheet (e.g. `Sheet1` hidden) and a visible sheet containing valid GL/TB columns (e.g. `Sheet3`)
- **THEN** the system ignores the hidden sheet and automatically parses the visible valid sheet without throwing a missing columns error

#### Scenario: Multiple visible candidate sheets in Excel
- **WHEN** user uploads an Excel file containing two or more visible sheets that have tabular data
- **THEN** the system prompts the user with a sheet selection dialog showing candidate sheet names and column validation status, allowing the user to select the correct worksheet

#### Scenario: Single CSV or single sheet Excel upload
- **WHEN** user uploads a `.csv` or single-sheet `.xlsx` file with required GL columns
- **THEN** the system parses the file directly and transitions to normalization/staging as expected

## ADDED Requirements

### Requirement: Sheet Visibility and Column Auto-Discovery
The Excel parsing engine SHALL inspect workbook sheet visibility metadata (`wb.Workbook.Sheets`) and score candidate visible sheets by verifying mandatory columns (`accountName` and `balance`) and optional FSLI columns (`accountCode`, `fsliName`, `fsliBalance`, `noUrut`).

#### Scenario: Workbook contains hidden sheets
- **WHEN** workbook sheets have `Hidden: 1` or `Hidden: 2`
- **THEN** these sheets SHALL NOT be selected as the auto-parsed sheet or offered as recommended sheets
