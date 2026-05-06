## ADDED Requirements

### Requirement: Appendix 7a PDF Generation
The system SHALL allow users to generate a formal "Appendix 7a" report in PDF format from any CSA assessment record.

#### Scenario: Exporting detailed layout
- **WHEN** user clicks "Export Appendix 7a (Detailed)"
- **THEN** system SHALL generate a PDF containing the branded header, sample matrix, test procedures, and auditor sign-off area

#### Scenario: Exporting summary layout
- **WHEN** user clicks "Export Appendix 7a (Summary)"
- **THEN** system SHALL generate a PDF containing the branded header, result summary (pass/fail per control), and auditor sign-off area (omitting individual samples)

### Requirement: Regulatory Layout Compliance
The generated PDF SHALL strictly follow the layout standards defined in SK-5 Lampiran 7a, including the "Kertas Kerja Evaluasi Pengendalian" title and standardized headers.

#### Scenario: Header verification
- **WHEN** a report is generated
- **THEN** it SHALL include Company Logo, Company Name, Process Name, No GL, Period, and Assessment Date in the top section
