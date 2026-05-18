## ADDED Requirements

### Requirement: Integrasi Unsaved Changes pada Form Remediasi
Sistem MUST mengaktifkan proteksi unsaved changes pada `RemediationForm` untuk mencegah kehilangan data input rencana aksi yang kompleks.

#### Scenario: Menutup form remediasi dengan perubahan
- **WHEN** user sedang mengisi Rencana Aksi dan menekan tombol "Close" atau area di luar dialog tanpa menyimpan
- **THEN** sistem menampilkan dialog konfirmasi `UnsavedChangesDialog`
