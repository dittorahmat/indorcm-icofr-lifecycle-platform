# Tasks: Migrate Database Schema to Dedicated `icofr` Schema

- [ ] **Task 1: Update Drizzle Schema Definition**
  - [ ] Edit `worker/db/schema.ts` untuk menggunakan `pgSchema("icofr")` pada seluruh tabel dan enum.
  - [ ] Edit `drizzle.config.ts` untuk menambahkan `schemaFilter: ["icofr"]`.

- [ ] **Task 2: Build & Type-Check Verification**
  - [ ] Jalankan `npm run type-check` untuk memastikan tidak ada TS error.
  - [ ] Jalankan `npm run build` untuk memastikan proyek terkompilasi dengan bersih.

- [ ] **Task 3: Create Migration & Setup Scripts**
  - [ ] Buat skrip migrasi database `scripts/migrate-schema-to-icofr.ts` untuk memindahkan tabel dari `public` ke `icofr` dan mengeset `search_path`.
  - [ ] Buat skrip SQL templat `scripts/setup-cross-app-access.sql` untuk konfigurasi akses user luar.

- [ ] **Task 4: Automated Testing & Validation**
  - [ ] Jalankan `npm test` untuk memastikan seluruh unit/integration test tetap lulus (pass).
