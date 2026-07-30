# Proposal: Migrate Database Schema to Dedicated `icofr` Schema

## Why
Saat ini seluruh tabel aplikasi IndoGRC Pro (ICOFR Lifecycle Platform) disimpan di skema default PostgreSQL (`public`).
Untuk mendukung rencana integrasi **cross-aplikasi** dan **cross-server** melalui PostgreSQL Connection String, data aplikasi ICOFR perlu diisolasi ke dalam skema tersendiri (`icofr`). Pemisahan skema ini bertujuan untuk:
1. **Isolasi Data & Keamanan**: Mencegah tabrakan nama tabel (*name collision*) dan membatasi hak akses aplikasi luar hanya pada skema data ICOFR.
2. **Tata Kelola Multi-App**: Memudahkan administrasi database saat PostgreSQL diakses oleh beberapa aplikasi berbeda (misal `app_finance`, `app_hr`, `icofr`).

## What Changes
- **Drizzle Schema Update**: Mengatur definisi tabel di `worker/db/schema.ts` menggunakan `pgSchema("icofr")` agar Drizzle ORM secara resmi mengelola skema `icofr`.
- **Drizzle Config Update**: Menambahkan `schemaFilter: ["icofr"]` pada `drizzle.config.ts`.
- **Database Migration Script**: Membuat skrip SQL/TS migrasi aman untuk memindahkan seluruh tabel eksisting dari `public` ke `icofr` beserta penyesuaian `search_path` agar aplikasi eksisting berjalan 100% tanpa downtime/breakage.
- **Cross-App Access Script**: Menyiapkan templat SQL untuk pembuatan role/user database luar dengan akses *read-only* atau *read-write* terbatas pada skema `icofr`.

## Capabilities

### New Capabilities
- `schema-isolation`: Seluruh struktur dan data ICOFR terisolasi dalam skema `icofr`.
- `cross-app-access`: User/role terpisah untuk aplikasi luar dengan hak akses terbatas pada skema `icofr`.

### Modified Capabilities
- `database-persistence`: Koneksi ORM dan query aplikasi mengacu pada skema `icofr` dengan fallback `search_path`.

## Impact
- **Database**: Skema baru `icofr` dibuat di PostgreSQL dan seluruh 30+ tabel dipindahkan dari `public` ke `icofr`.
- **ORM & Build**: Modifikasi pada `worker/db/schema.ts` dan `drizzle.config.ts`.
- **Aplikasi Existing**: Tidak ada perubahan pada logika API/Routes/Services karena resolusi tabel ditangani melalui Drizzle Schema & PostgreSQL `search_path`.
