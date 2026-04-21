## ADDED Requirements

### Requirement: Lampiran 7 Compliant PDF Export
Sistem SHALL mampu men-generate file PDF yang formatnya identik dengan Lampiran 7 pada Regulasi SK-5/DKU.MBU/11/2024.
#### Scenario: Exporting CSA document to PDF
- **WHEN** user mengklik ikon PDF pada baris riwayat CSA
- **THEN** sistem mengunduh file PDF yang berisi: Logo Perusahaan, Header Section I, Prosedur Section II, Tabel Pengujian Section III, dan Sign-off Section IV

### Requirement: Digital Sign-off Verification (QR Code)
Sistem SHALL menyertakan mekanisme verifikasi digital pada dokumen PDF hasil export.
#### Scenario: PDF with QR verification
- **WHEN** PDF di-generate setelah sign-off berhasil dilakukan
- **THEN** sistem menyertakan QR Code di bagian bawah dokumen yang mengarah ke link verifikasi integritas data
