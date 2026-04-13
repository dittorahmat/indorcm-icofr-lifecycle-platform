## 1. Infrastructure & Setup

- [ ] 1.1 Instalasi dependencies: `drizzle-orm`, `@neondatabase/serverless`, `better-auth`.
- [ ] 1.2 Konfigurasi `drizzle-kit` untuk manajemen migrasi database.
- [ ] 1.3 Setup koneksi database Neon di `worker/db/index.ts`.
- [ ] 1.4 Konfigurasi `wrangler secret` untuk `DATABASE_URL` dan `BETTER_AUTH_SECRET`.

## 2. Database Schema Definition

- [ ] 2.1 Definisi skema tabel Better Auth (Users, Sessions, Organizations) di `worker/db/schema.ts`.
- [ ] 2.2 Definisi skema tabel Bisnis (RCM, Controls, GL Snapshots, GL Rows) di `worker/db/schema.ts`.
- [ ] 2.3 Definisi skema tabel `audit_logs` untuk pencatatan global.
- [ ] 2.4 Jalankan `drizzle-kit push` atau `generate` untuk sinkronisasi schema ke Neon.

## 3. Better Auth Integration

- [ ] 3.1 Implementasi Better Auth server di `worker/auth.ts` dengan Organization plugin.
- [ ] 3.2 Ganti middleware autentikasi di `worker/index.ts` agar menggunakan validasi session Better Auth.
- [ ] 3.3 Implementasi endpoint `/api/auth/*` untuk handle login, logout, dan org management.

## 4. Backend Route Refactor

- [ ] 4.1 Refactor RCM routes untuk menggunakan Drizzle SQL query dan recording ke `audit_logs`.
- [ ] 4.2 Refactor Control routes (termasuk BPM updates) dengan integrasi audit log Lampiran 6.
- [ ] 4.3 Refactor GL Snapshot upload: implementasi flattening CSV rows ke tabel `gl_rows`.
- [ ] 4.4 Refactor Reporting endpoints (Summary & Export) agar menggunakan SQL agregasi.

## 5. Frontend & Validation

- [ ] 5.1 Update API client di frontend untuk menyesuaikan struktur response Drizzle.
- [ ] 5.2 Verifikasi fitur Multi-Company: Pastikan data terisolasi dengan benar antar organisasi.
- [ ] 5.3 Verifikasi Audit Log: Pastikan perubahan RCM tercatat di tabel audit dan bisa difilter untuk Lampiran 6.
- [ ] 5.4 Penghapusan kode legacy `worker/core-utils.ts` dan logic Durable Objects yang sudah tidak terpakai.
