## MODIFIED Requirements

### Requirement: Manual GL Upload
The system SHALL support the upload of GL data in `.csv`, `.xlsx`, and `.xls` formats, using an abstracted parsing service to extract standardized fields (Account Name, Balance, FSLI Code).

#### Scenario: Robust File Parsing
- **WHEN** a user drops a valid `.xlsx` file
- **THEN** the system SHALL use the `gl-parser` service to normalize the data before saving it to the snapshot

### Requirement: Quantitative Significance Calculation
The system SHALL automatically mark accounts as `Significant` if the absolute value of their balance meets or exceeds the PM (Performance Materiality) value, using the pure math engine.

#### Scenario: Quantitative Significance detection
- **WHEN** an account balance is 100,000 and PM is 50,000
- **THEN** the system SHALL mark the account as quantitatively significant
