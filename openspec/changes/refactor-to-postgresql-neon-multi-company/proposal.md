## Why

Aplikasi saat ini menggunakan Cloudflare Durable Objects (JSON storage) yang memiliki keterbatasan performa untuk data besar (seperti GL) dan sulit untuk di-query antar entitas. Refactor ke PostgreSQL (Neon) dengan Drizzle ORM diperlukan untuk mendukung struktur Multi-Company (Anak Perusahaan) yang kompleks, menjamin integritas data sesuai regulasi BUMN SK-5, dan menyediakan jejak audit (Audit Trail) yang terpusat dan mudah di-audit.

## What Changes

- **Database Migration**: Mengganti Cloudflare Durable Objects dengan PostgreSQL (Neon) sebagai layer persistensi utama. **BREAKING**
- **ORM Implementation**: Menggunakan Drizzle ORM untuk manajemen skema dan query database yang type-safe.
- **Better Auth Integration**: Mengganti sistem mock-auth dengan Better Auth untuk manajemen user, session, dan dukungan multi-organization secara native. **BREAKING**
- **Flattened GL Storage**: Mengubah penyimpanan baris data GL dari field JSON tunggal menjadi tabel relasional `gl_rows` untuk optimasi filter dan agregasi. **BREAKING**
- **Centralized Audit Logging**: Implementasi tabel `audit_logs` tunggal untuk merekam seluruh mutasi data, sekaligus memenuhi standar Lampiran 6 (Log Perubahan) SK-5 secara otomatis.
- **Backend Core Refactor**: Menghapus `worker/core-utils.ts` yang berbasis Durable Objects dan mengupdate `user-routes.ts` untuk menggunakan query SQL.

## Capabilities

### New Capabilities
- `multi-tenancy`: Mendukung isolasi data antar BUMN (Induk) dan Anak Perusahaan menggunakan pola `organization_id`.
- `centralized-auditing`: Sistem pencatatan perubahan data (System Audit) dan manajemen log perubahan regulasi sesuai Lampiran 6 SK-5.
- `user-authentication`: Sistem manajemen user, login, dan role berbasis industri menggunakan Better Auth.

### Modified Capabilities
- `gl-integration`: Mengubah skema integrasi data GL dari penyimpanan dokumen JSON menjadi baris-baris tabel relasional untuk performa skala besar.

## Impact

- **Storage**: Penggunaan Neon PostgreSQL sebagai database utama.
- **API**: Perubahan pada hampir seluruh endpoint di `user-routes.ts` untuk migrasi dari class-based entity ke SQL query.
- **Runtime**: Perlu konfigurasi database connection string di wrangler secret.
- **Auth**: Frontend harus diupdate untuk menggunakan Better Auth client alih-alih Bearer token mock yang ada sekarang.
