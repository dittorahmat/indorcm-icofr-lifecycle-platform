## ADDED Requirements

### Requirement: Empty Row Filtering

Sistem SHALL auto-filter empty rows dari GL data untuk clean processing.

**Empty Row Detection:**
- All columns empty/null
- All columns contain only whitespace
- Row with only semicolons/delimiters

**Filtering Behavior:**
1. Remove empty rows automatically
2. Count filtered rows
3. Show info message: "Filtered X empty rows"
4. Do not include in balance calculations

#### Scenario: Sample Data GL.csv with 400+ empty rows
- **WHEN** user uploads file dengan 45 data rows + 400 empty rows
- **THEN** sistem filter to 45 rows dan show "Filtered 400 empty rows"

#### Scenario: All rows empty
- **WHEN** uploaded file contains only empty rows
- **THEN** show error "No data found in file"

### Requirement: Data Integrity Check

Sistem SHALL perform integrity checks pada GL data sebelum import.

**Checks:**
1. Balance check: Total debits = Total credits (if applicable)
2. Required fields: accountName and balance must exist
3. Data type validation: balance must be numeric

#### Scenario: Balance check
- **WHEN** GL data uploaded
- **THEN** show total balance dan status (balanced/unbalanced)

#### Scenario: Missing required fields
- **WHEN** row missing accountName or balance
- **THEN** skip row dan show warning

### Requirement: Data Preview

Sistem SHALL show preview of imported GL data sebelum processing.

**Preview Features:**
- Show first 50 rows
- Display detected column mapping
- Show summary statistics (total rows, total balance)
- Highlight validation errors

#### Scenario: Preview display
- **WHEN** GL file uploaded
- **THEN** show preview table dengan first 50 rows

#### Scenario: Large file warning
- **WHEN** file contains > 1000 rows
- **THEN** show warning "Large file: X rows. Only first 50 shown in preview."
