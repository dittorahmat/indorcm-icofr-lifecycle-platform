## ADDED Requirements

### Requirement: Otomatisasi Pembuatan Action Plan dari CSA
Setiap kali laporan CSA di-sign off dengan hasil "Ineffective", sistem MUST secara atomik membuat record baru pada tabel `deficiencies` DAN membuat satu record awal pada tabel `action_plans` dengan `workflowStatus: "Ineffective"`.

#### Scenario: Sign-off CSA Ineffective
- **WHEN** user melakukan sign-off CSA dengan kesimpulan "Ineffective"
- **THEN** sistem membuat entri di tabel `deficiencies`
- **AND** sistem membuat entri di tabel `action_plans` yang terhubung ke defisiensi tersebut
- **AND** temuan tersebut langsung muncul di kolom "Ineffective" pada Deficiency Board
