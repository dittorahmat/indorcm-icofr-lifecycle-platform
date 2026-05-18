## ADDED Requirements

### Requirement: Urutan Hierarkis Benchmark
Sistem WAJIB mengurutkan daftar FSLI dalam modal "Set Benchmark Basis" berdasarkan nilai `noUrut` terkecil (minimum) yang ditemukan di antara semua akun GL yang termasuk dalam FSLI tersebut.

#### Scenario: Pengurutan berdasarkan No Urut
- **WHEN** Pengguna membuka modal "Set Benchmark Basis"
- **THEN** FSLI "Kas dan Setara Kas" (min noUrut: 1) muncul sebelum "TOTAL ASET" (min noUrut: 10) meskipun secara alfabet "K" setelah "T"

### Requirement: Perhitungan Saldo FSLI Unik
Sistem WAJIB menjumlahkan saldo absolut (|Saldo|) dari semua baris GL yang memiliki `fsliName` yang sama untuk ditampilkan sebagai nilai total basis di modal benchmark.

#### Scenario: Akumulasi saldo per FSLI
- **WHEN** Terdapat dua baris GL "Bank A" (100) dan "Bank B" (200) dengan FSLI yang sama "Kas"
- **THEN** Modal menampilkan FSLI "Kas" dengan total saldo 300
