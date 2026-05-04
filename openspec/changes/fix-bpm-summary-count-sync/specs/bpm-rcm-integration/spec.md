## ADDED Requirements

### Requirement: Canvas-State Synchronization
Sistem MUST menggunakan kondisi visual pada kanvas diagram sebagai *Source of Truth* untuk sinkronisasi relasi risiko dan kontrol di database.

#### Scenario: Removing a control link from UI
- **WHEN** user menghapus link kontrol dari sebuah node di BPM Editor dan menekan tombol "Save"
- **THEN** sistem MUST menghapus mapping tersebut dari tabel `rcm_controls` tanpa memedulikan apakah risiko tersebut bertipe lokal atau library.

### Requirement: Accurate Summary Updates
Setiap operasi simpan (Save) pada diagram MUST memicu pembaruan angka summary secara real-time pada tabel proses induk.

#### Scenario: Saving a diagram with multiple controls
- **WHEN** user menekan tombol "Save" pada diagram yang memiliki 2 risiko dengan total 3 kontrol unik
- **THEN** sistem MUST memperbarui kolom `risk_count` menjadi 2 dan `control_count` menjadi 3 pada tabel `bpm_processes`.
