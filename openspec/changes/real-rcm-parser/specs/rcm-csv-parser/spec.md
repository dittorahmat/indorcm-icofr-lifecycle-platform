## ADDED Requirements

### Requirement: RCM Spreadsheet Parsing
The system SHALL be capable of parsing RCM data uploaded in `.csv`, `.xls`, or `.xlsx` formats directly within the browser.

#### Scenario: Successful file parsing
- **WHEN** the user uploads a valid RCM spreadsheet file in the Smart Import Wizard
- **THEN** the system SHALL extract the rows into a JSON array for staging

### Requirement: Automatic Column Detection
The parser SHALL automatically map user spreadsheet headers to internal system fields using a predefined dictionary (`RCM_COLUMN_MAPPING`).

#### Scenario: Header mapping flexibility
- **WHEN** the user uploads a file with a header named "Kode Entitas" instead of "Entity_Code"
- **THEN** the system SHALL correctly map that column to the `entityCode` internal field

### Requirement: Relational Integrity Validation
The parser MUST reject files that do not contain the necessary columns to link the RCM data to the financial scoping baseline.

#### Scenario: Missing relational columns
- **WHEN** the user uploads an RCM file missing the `Entity_Code` or `No_GL` columns
- **THEN** the parser SHALL return a validation error stating "Missing required columns" and block the ingestion process
