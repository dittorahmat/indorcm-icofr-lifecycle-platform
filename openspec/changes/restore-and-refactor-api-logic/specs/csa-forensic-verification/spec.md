## ADDED Requirements

### Requirement: CSA Forensic Data Verification
The system MUST capture and store forensic metadata (GPS, timestamp, biometric) during CSA record sign-off.

#### Scenario: Successful sign-off with forensic data
- **WHEN** user signs off a CSA record with valid metadata
- **THEN** system saves the record and forensic fields in the database

### Requirement: CSA PDF Export
The system MUST provide an endpoint to export CSA records as regulatory-compliant PDF reports.

#### Scenario: PDF report generation
- **WHEN** user requests a PDF report for a signed-off CSA record
- **THEN** system generates and downloads the PDF file correctly
