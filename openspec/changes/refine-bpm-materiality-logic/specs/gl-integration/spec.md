## MODIFIED Requirements

### Requirement: Baseline Scoping Data Flow
Sistem HARUS memastikan data GL yang ditampilkan di BPM sinkron dengan hasil pemetaan FSLI pada simulasi scoping yang telah disahkan.

#### Scenario: GL Account Filtering by FSLI
- **WHEN** user memilih FSLI di halaman BPM
- **THEN** sistem memfilter daftar Nomor GL dari Snapshot GL aktif yang memiliki `fsliName` sesuai dengan pilihan user, sesuai dengan pemetaan yang disahkan di modul Scoping.
