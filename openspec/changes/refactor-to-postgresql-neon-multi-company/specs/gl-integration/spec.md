## MODIFIED Requirements

### Requirement: Flattened GL Data Storage
Sistem WAJIB memproses file CSV GL yang diunggah dan memecah setiap baris datanya ke dalam tabel relasional `gl_rows`. Setiap baris harus memiliki referensi ke `gl_snapshot_id` dan `organization_id`.

#### Scenario: GL Batch Processing
- **WHEN** user mengunggah file CSV GL (misal: PTBA_Scoping.csv)
- **THEN** sistem meng-insert ribuan baris data ke tabel `gl_rows` dalam satu batch transaction untuk menjaga integritas data.

### Requirement: Granular GL Querying
Sistem WAJIB mendukung pengambilan data GL secara granular dari database menggunakan SQL alih-alih memuat seluruh JSON ke memory.

#### Scenario: Threshold Filtering in DB
- **WHEN** user membuka halaman Scoping
- **THEN** sistem melakukan query `SELECT` dengan filter `balance >= PM` langsung di level database untuk menentukan signifikansi kuantitatif.
