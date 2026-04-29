## ADDED Requirements

### Requirement: Split Navigation for RCM and CSA in BPMPage
Daftar sub-proses di `BPMPage` HARUS memisahkan akses navigasi antara Worksheet (RCM) dan Assessment (CSA) untuk menghindari kebingungan user.

#### Scenario: Navigasi ke RCM Worksheet
- **WHEN** User mengklik icon `Edit2` (pencil) pada kolom Action atau klik nama sub-proses (jika dikonfigurasi)
- **THEN** Sistem HARUS tetap menyediakan akses ke `BPMModal` yang berisi tab Worksheet/RCM.

#### Scenario: Navigasi ke CSA Assessment
- **WHEN** User mengklik nama sub-proses yang memiliki link aktif
- **THEN** Sistem HARUS memicu pembukaan `CSAModal` secara langsung.
