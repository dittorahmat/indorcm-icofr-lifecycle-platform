## Purpose

Memastikan skema database Drizzle ORM terorganisir per domain bounded context dan komponen data grid scoping terurai rapi agar tidak melanggar batas LOC arsitektur proyek.

## ADDED Requirements

### Requirement: Modular Drizzle Database Schema
Sistem basis data PostgreSQL Drizzle ORM SHALL didekomposisi ke dalam modul-modul skema mandiri di direktori `worker/db/schema/` tanpa menghasilkan perubahan DDL (Zero Migration Diff) pada database.

#### Scenario: Drizzle schema imports resolution
- **WHEN** consumer mengimpor tabel atau relations dari `worker/db/schema`
- **THEN** seluruh tabel dan relasi ter-export secara identik dan kompilasi TypeScript berjalan tanpa error

#### Scenario: Database schema synchronization check
- **WHEN** developer menjalankan validasi skema database
- **THEN** skema Drizzle sesuai dengan struktur database eksisting tanpa ada perubahan skema yang tidak diinginkan

### Requirement: Scoping GL Data Grid LOC Decomposition
Komponen GL Data Grid scoping SHALL didekomposisi menjadi modul kolom terpisah dan toolbar presenter dengan container orchestrator berukuran kurang dari 400 LOC.

#### Scenario: GL data grid interactive operation
- **WHEN** user membuka halaman Scoping GL Data Grid dan melakukan filtering atau sorting
- **THEN** data grid menampilkan data GL dan kalkulasi FSLI secara akurat sesuai fungsionalitas sebelumnya
