## ADDED Requirements

### Requirement: Standardized Audit Testing Report
The system SHALL provide a consolidated report of all TOD and TOE results in accordance with SK-5/DKU.MBU/11/2024.

#### Scenario: View Testing Results
- **WHEN** a user navigates to the "Laporan Hasil Pengujian" tab in Reports
- **THEN** the system SHALL display a table containing all recorded test results.

### Requirement: Mandatory Evaluation Attributes Mapping
The testing report SHALL display the status of the 6 mandatory evaluation attributes for each test record.

#### Scenario: Attribute Visibility
- **WHEN** viewing a specific test record in the report
- **THEN** the system SHALL show whether the following criteria were met: objective achievement, timing, authority, information reliability, period coverage, and evidence sufficiency.

### Requirement: Sampling Documentation
For TOE records, the system SHALL explicitly display the sample size used during testing.

#### Scenario: TOE Detail
- **WHEN** a record is of type 'TOE'
- **THEN** the system SHALL include a column for 'Ukuran Sampel'.
