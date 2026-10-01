## Purpose

Menyediakan format pelaporan tabular resmi 24-kolom untuk Kertas Kerja Penentuan Degree of Deficiency (DoD) sesuai mandat Lampiran 10 SK-5/DKU.MBU/11/2024 bagi pemangku kepentingan audit BUMN.

## ADDED Requirements

### Requirement: 24-Column Regulatory Table Display
The system SHALL display all deficiency evaluations within a standardized 24-column tabular report conforming directly to Lampiran 10 of Regulation SK-5/DKU.MBU/11/2024 (columns i through xxiv).

#### Scenario: User navigates to Lampiran 10 tab
- **WHEN** user selects the "DoD (Lampiran 10)" tab in the Regulatory Appendices view
- **THEN** system renders the formal table with all 24 numbered regulatory columns grouped by Deficiency Details (i–vi), Aggregation Classification (vii–x), Financial Statement Assertions (xi–xvii), and AS 2201 Decision Tree Boxes (xviii–xxiv).

#### Scenario: Display deficiency evaluations with completed DoD
- **WHEN** deficiencies have completed DoD worksheet evaluations
- **THEN** system displays the evaluation results, including exposure values, assertion checkmarks, Box 1–7 answers, and final severity conclusion (CD, SD, or MW).

### Requirement: Report Filtering and Search
The system SHALL provide interactive filtering capabilities to filter the 24-column table by deficiency severity, remediation status, and business process.

#### Scenario: Filter by severity
- **WHEN** user selects a severity filter (e.g. "Material Weakness")
- **THEN** table updates immediately to display only deficiencies classified as Material Weakness.

#### Scenario: Empty state handling
- **WHEN** no deficiencies match the active filter criteria
- **THEN** system displays an informative enterprise empty state message indicating no records were found.

### Requirement: Print and Export Support
The system SHALL allow users to export the Lampiran 10 table to CSV format and format the report cleanly for physical or PDF printing.

#### Scenario: Export table data to CSV
- **WHEN** user clicks the "Export CSV" button
- **THEN** system downloads a properly formatted CSV file containing all 24 columns and currently filtered rows.

#### Scenario: Print preview layout
- **WHEN** user triggers browser print preview
- **THEN** non-printable UI controls are hidden, table typography adjusts to print layout, and digital sign-off verification blocks appear at the bottom.
