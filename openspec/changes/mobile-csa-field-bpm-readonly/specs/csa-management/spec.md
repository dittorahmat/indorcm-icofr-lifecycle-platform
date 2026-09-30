## ADDED Requirements

### Requirement: Alur pengisian CSA adaptif viewport kecil
Sistem SHALL menyediakan alur pengisian CSA yang adaptif terhadap viewport kecil (kartu daftar, form sampel satu-fokus, upload kamera, aksi sticky) sebagaimana didefinisikan pada kapabilitas `mobile-csa-field-form`, tanpa mengubah aturan validasi, granular-verification, filtering kontrol, maupun lifecycle-phase yang sudah ada pada kapabilitas ini.

#### Scenario: Aturan validasi tetap berlaku di mobile
- **WHEN** pengguna berupaya sign-off CSA sebagai Effective dari HP dengan titik verifikasi yang belum lengkap
- **THEN** sistem memblokir sign-off dengan pesan yang sama seperti di desktop

#### Scenario: Filter kontrol konsisten antar mode
- **WHEN** sistem memuat kontrol untuk suatu Sub-Proses di HP
- **THEN** sistem menerapkan aturan filtering kontrol yang identik dengan desktop (case-insensitive dengan fallback `bpmProcessId`)
