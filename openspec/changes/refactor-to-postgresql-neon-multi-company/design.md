## Context

Aplikasi IndoRCM Pro saat ini menggunakan arsitektur serverless di Cloudflare Workers dengan penyimpanan data menggunakan Durable Objects (DO). Sistem persistensi saat ini menggunakan pola `IndexedEntity` yang menyimpan seluruh state entitas sebagai satu dokumen JSON. Meskipun cepat untuk prototype, pola ini sulit untuk skalabilitas data besar (seperti ribuan baris GL) dan tidak mendukung query relasional (Join) yang krusial untuk pelaporan agregasi multi-company.

## Goals / Non-Goals

**Goals:**
- Mengganti Durable Objects dengan Neon PostgreSQL untuk performa query relasional.
- Implementasi Better Auth untuk manajemen user dan multi-tenancy (Organizations).
- Centralized Audit Logging untuk kepatuhan regulasi Lampiran 6 SK-5.
- Flattening data GL (CSV rows) ke dalam tabel SQL agar bisa di-filter secara granular.

**Non-Goals:**
- Migrasi data lama dari Durable Objects (user sepakat untuk reset data).
- Perubahan total pada UI frontend (hanya penyesuaian API client).
- Implementasi fitur baru di luar lingkup refactor persistensi dan auth.

## Decisions

### 1. Database & ORM: Neon + Drizzle
- **Pilihan**: Neon PostgreSQL dengan Drizzle ORM.
- **Rasional**: Neon mendukung koneksi HTTP/Websocket yang sangat cepat dari Cloudflare Workers via `@neondatabase/serverless`. Drizzle dipilih karena sangat ringan (zero-overhead) dan memiliki dukungan TypeScript yang paling baik untuk arsitektur serverless dibanding Prisma.
- **Alternatif**: Cloudflare D1 (masih terbatas pada fitur SQL tertentu dibanding Postgres native).

### 2. Authentication: Better Auth
- **Pilihan**: Better Auth dengan `organization` plugin.
- **Rasional**: Mendukung pola multi-tenancy secara native. Memudahkan pemisahan data antar BUMN dan anak perusahaannya. Fitur `ctx.waitUntil` menjamin performa di edge.
- **Alternatif**: Lucia Auth (deprecated), Clerk (biaya tinggi untuk enterprise BUMN).

### 3. Data Structure: Flattened GL Rows
- **Pilihan**: Memindahkan baris CSV ke tabel `gl_rows`.
- **Rasional**: Menghindari limitasi ukuran dokumen JSON di DO dan memungkinkan auditor mencari transaksi spesifik lintas periode/perusahaan langsung di database.

### 4. Auditing: Centralized Audit Logs
- **Pilihan**: Satu tabel `audit_logs` dengan kolom `is_regulatory: boolean`.
- **Rasional**: Memudahkan ekspor laporan Lampiran 6 secara otomatis dengan melakukan filter pada entitas RCM/BPM yang memiliki flag `is_regulatory`.

## Risks / Trade-offs

- **[Risk] Latency Database** → Neon berada di luar network Cloudflare (meskipun ada peering). Mitigasi: Gunakan Neon serverless driver dan optimasi query dengan index.
- **[Risk] Migration Complexity** → Hampir seluruh route di `user-routes.ts` harus ditulis ulang. Mitigasi: Lakukan migrasi per kelompok entitas (User -> Organizations -> RCM -> Controls).
- **[Risk] Deployment Secret** → Menyimpan connection string di environment variable. Mitigasi: Gunakan `wrangler secret` untuk keamanan tingkat tinggi.

## Migration Plan

1. **Setup**: Instalasi dependencies (`drizzle-orm`, `drizzle-kit`, `better-auth`, `@neondatabase/serverless`).
2. **Schema**: Definisi skema database di `worker/db/schema.ts`.
3. **Auth**: Setup Better Auth server di `worker/auth.ts`.
4. **Routes Migration**:
   - Refactor login & session.
   - Refactor RCM & Control (dengan integrasi audit log).
   - Refactor GL Upload (dengan worker background processing jika diperlukan).
5. **Frontend Update**: Update TanStack Query hooks untuk menyesuaikan struktur response baru.
