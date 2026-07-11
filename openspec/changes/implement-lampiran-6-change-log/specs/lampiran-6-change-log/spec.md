## ADDED Requirements

### Requirement: 11-Column Change Management Log Structure
The system SHALL capture and display the change log matching the exact 11 columns of Lampiran 6:
- (i) Nomor (No)
- (ii) Perusahaan
- (iii) Informasi Proses Bisnis
- (iv) Informasi Sub-proses Bisnis
- (v) Tanggal Laporan (Timestamp)
- (vi) Pemilik Pengendalian (Control Owner)
- (vii) Deskripsi proses bisnis dan/atau pengendalian sebelum perubahan
- (viii) Deskripsi proses bisnis dan/atau pengendalian setelah perubahan
- (ix) Referensi proses bisnis dan/atau pengendalian sebelum perubahan
- (x) Referensi proses bisnis dan/atau pengendalian setelah perubahan
- (xi) Tanggal Efektif

#### Scenario: Viewing the compliant Change Log table
- **WHEN** a user navigates to the Logs tab in the BPM Modal
- **THEN** the system SHALL render a table with columns matching the 11 regulatory fields
- **AND** it SHALL populate the rows with the audit log data matching the selected Sub-process/GL account

### Requirement: Change Categorization by 4 Regulatory Factors
The system SHALL require that all RCM/BPM updates and change requests specify one of the four regulatory factors as the reason for the change:
- Standard Akuntansi / Regulasi (Faktor Eksternal)
- Kebijakan / Prosedur (Internal Policy/SOP)
- Personel / Control Owner (Change in personnel)
- Sistem / Media Data (IT application/system change)

#### Scenario: Submitting a change request with categorization
- **WHEN** a user initiates a change request to update a Control or BPM element
- **THEN** the system SHALL require them to select one of the four regulatory change categories
- **AND** the category SHALL be saved in the change request and persisted to the audit log upon approval

### Requirement: Change Log Report and Digital Sign-off
The system SHALL provide a dedicated, printable Change Log Report under the Regulatory Appendices that displays all change logs and features formal approval blocks.

#### Scenario: Exporting and viewing the Change Log Report
- **WHEN** a user opens the "Log Perubahan (Lmp 6)" tab in the Reports page
- **THEN** the system SHALL render the fully structured Lampiran 6 table
- **AND** it SHALL display digital signature boxes showing "Disetujui oleh: (Pemilik Pengendalian)" and "Diketahui oleh: (Lini Kedua Fungsi ICOFR)" with matching verified statuses
- **AND** the system SHALL allow exporting the report to CSV and Excel formats
