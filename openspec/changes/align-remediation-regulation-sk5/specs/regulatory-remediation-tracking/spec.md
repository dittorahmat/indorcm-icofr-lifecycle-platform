## ADDED Requirements

### Requirement: Mandatory Regulatory Remediation Fields
The system MUST capture mandatory fields for remediation plans as required by Regulation SK-5 Lampiran 6. These fields include: `Fungsi Terkait`, `Penanggung Jawab`, `Deskripsi Rencana`, `Detail Aktivitas`, `Target Tanggal Remediasi`, and `Status Persetujuan`.

#### Scenario: Validating mandatory fields on save
- **WHEN** a user attempts to save a remediation plan without `Fungsi Terkait` or `Target Tanggal`
- **THEN** the system SHALL prevent saving and display a validation error identifying the missing regulatory fields

### Requirement: Year-End Remediation Timing Tracking
The system MUST track whether a remediation activity was completed "on or before year-end" to support Effectiveness Conclusion reporting in Appendix 11.

#### Scenario: Marking completion timing
- **WHEN** a remediation plan is moved to "Resolved"
- **THEN** the system SHALL capture the `Actual Completion Date` and automatically determine if it satisfies the "Before Year-End" flag based on the current fiscal year config
