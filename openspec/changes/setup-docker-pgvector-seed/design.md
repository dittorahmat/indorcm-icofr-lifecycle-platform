## Context

Platform IndoRCM membutuhkan database PostgreSQL yang terpasang ekstensi `pgvector` untuk mendukung modul AI / RAG Document Vector Search. Saat ini `docker-compose.yml` masih menggunakan `postgres:15-alpine` tanpa `pgvector`, dan container aplikasi tidak secara otomatis menjalankan Drizzle schema migration maupun seeding akun default.

## Goals / Non-Goals

**Goals:**
- Mengganti image database di Docker Compose dengan `pgvector/pgvector:pg15`.
- Mengonfigurasi `healthcheck` DB di Compose agar container `app` menunggu ketersediaan DB secara penuh.
- Menyediakan script runner `scripts/run-seed.ts` (mengadaptasi `worker/db/seed.ts` menggunakan driver `postgres` yang kompatibel dengan Node/Bun runtime lokal).
- Menyediakan `docker-entrypoint.sh` untuk menjalankan `drizzle-kit push` & `scripts/run-seed.ts` sebelum menjalankan Hono backend.

**Non-Goals:**
- Mengubah struktur tabel Drizzle schema yang sudah ada.
- Mengubah alur autentikasi Better Auth di luar penyiapan seed data default.

## Decisions

### Decision 1: Penggunaan Image `pgvector/pgvector:pg15` vs Manual Compilation
- **Pilihan**: Menggunakan image Docker resmi `pgvector/pgvector:pg15`.
- **Alasan**: Lebih stabil, siap pakai tanpa perlu menambah langkah kompilasi C/Alpine build tools di Dockerfile DB, serta menghemat waktu build Docker.

### Decision 2: Standalone Seed Script (`scripts/run-seed.ts`) vs Neon HTTP Driver
- **Pilihan**: Membuat `scripts/run-seed.ts` yang membaca `DATABASE_URL` menggunakan driver `postgres` (npm package `postgres`).
- **Alasan**: `worker/db/seed.ts` bawaan menggunakan `@neondatabase/serverless` (Neon HTTP proxy) yang ditujukan untuk Cloudflare Workers/Neon cloud. Container Docker beroperasi dengan koneksi direct TCP PostgreSQL, sehingga butuh driver direct node postgres.

### Decision 3: Custom Docker Entrypoint
- **Pilihan**: Menggunakan `docker-entrypoint.sh` sebagai `ENTRYPOINT` di Dockerfile.
- **Alasan**: Menjamin siklus startup urut: **Healthcheck DB Passed -> Drizzle Migration Push -> Seed Data Admin -> Server Start**.

## Risks / Trade-offs

- **[Risk]** Drizzle push gagal jika database belum menerima koneksi.
  - *Mitigation*: Gunakan `pg_isready` pada container DB dengan `healthcheck` Compose `service_healthy`.
- **[Risk]** Seeding berulang menghapus atau menimpa data yang ada.
  - *Mitigation*: `worker/db/seed.ts` dan `run-seed.ts` menggunakan logika *Non-Destructive Upsert* (`onConflictDoNothing()` / `onConflictDoUpdate()`).
