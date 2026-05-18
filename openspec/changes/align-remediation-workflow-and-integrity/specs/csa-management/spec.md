## ADDED Requirements

### Requirement: Sinkronisasi Status Akhir CSA ke Modul Defisiensi
Sistem SHALL memastikan bahwa setiap perubahan status CSA menjadi "Ineffective" (baik melalui rute POST baru maupun PUT update) akan memicu pembuatan atau update record defisiensi yang sinkron.

#### Scenario: Update CSA Draft menjadi Ineffective
- **WHEN** user mengedit laporan CSA yang berstatus "Draft" menjadi "Ineffective" dan menekan Sign-off
- **THEN** sistem mengupdate record CSA
- **AND** sistem otomatis membuat entri baru di tabel `deficiencies` dan `action_plans` jika belum ada
