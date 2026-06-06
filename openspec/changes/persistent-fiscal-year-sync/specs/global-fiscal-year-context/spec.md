## ADDED Requirements

### Requirement: Prioritas Inisialisasi Tahun Fiskal
Sistem MUST menentukan tahun fiskal aktif berdasarkan urutan prioritas yang ketat saat inisialisasi aplikasi.

#### Scenario: Prioritas URL Parameter
- **WHEN** URL mengandung query parameter `?year=2024`
- **THEN** sistem MUST menggunakan 2024 sebagai `workingYear` dan mengabaikan nilai di storage

#### Scenario: Fallback ke Storage
- **WHEN** URL TIDAK mengandung query parameter `?year`
- **THEN** sistem MUST mencoba mengambil nilai dari `localStorage`

#### Scenario: Fallback ke Default Sistem
- **WHEN** URL dan Storage kosong
- **THEN** sistem MUST menggunakan tahun berjalan (default 2026) sebagai `workingYear`
