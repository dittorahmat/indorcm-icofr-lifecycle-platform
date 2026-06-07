## ADDED Requirements

### Requirement: Scoped Verification Design
Komponen `VerificationDesignPage` SHALL mendukung pemfilteran data berdasarkan ID proses bisnis (BPM) untuk menampilkan desain verifikasi yang relevan secara kontekstual.

#### Scenario: Filtering by BPM ID in Modal
- **WHEN** komponen `VerificationDesignPage` dipanggil dengan prop `filterBpmId`
- **THEN** sistem SHALL memanggil API `/api/rcm-matrix/verification-design` dengan query parameter `bpmId`
- **AND** data yang ditampilkan dalam tabel SHALL hanya yang memiliki keterkaitan dengan BPM tersebut.

### Requirement: Embedded Mode UI
Komponen `VerificationDesignPage` SHALL memiliki mode tampilan `embedded` yang menyembunyikan elemen navigasi global aplikasi.

#### Scenario: Embedded View inside Modal
- **WHEN** komponen `VerificationDesignPage` memiliki prop `embedded` bernilai `true`
- **THEN** sistem SHALL menyembunyikan `AppLayout` (Sidebar/Header global)
- **AND** sistem SHALL menyembunyikan `RCMPageHeader` yang berisi tombol cetak dan filter global.
