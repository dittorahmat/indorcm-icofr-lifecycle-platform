## 1. Database Image & Healthcheck Configuration

- [x] 1.1 Perbarui `docker-compose.yml` untuk mengganti image `postgres:15-alpine` menjadi `pgvector/pgvector:pg15`
- [x] 1.2 Tambahkan blok `healthcheck` `pg_isready` pada service `db` di `docker-compose.yml`
- [x] 1.3 Perbarui dependency `depends_on` service `app` menjadi `condition: service_healthy`

## 2. Seed Script Runner untuk Local Postgres

- [x] 2.1 Buat script `scripts/run-seed.ts` yang mengimpor Drizzle schema & memproses seed data dasar menggunakan driver direct `postgres`
- [x] 2.2 Uji eksekusi `npx tsx scripts/run-seed.ts` secara lokal untuk memverifikasi pembuatan user `admin@bumn.go.id`

## 3. Entrypoint & Dockerfile Integration

- [x] 3.1 Buat skrip `docker-entrypoint.sh` dengan urutan eksekusi: `drizzle-kit push`, `run-seed.ts`, dan `bun run server.js`
- [x] 3.2 Berikan hak akses eksekusi (`chmod +x docker-entrypoint.sh`)
- [x] 3.3 Sesuaikan `Dockerfile` untuk menyalin skrip `drizzle`, `drizzle.config.ts`, dan `docker-entrypoint.sh` ke stage production serta mengatur `ENTRYPOINT`

## 4. Verification & Testing

- [x] 4.1 Eksekusi `docker compose build` dan `docker compose up -d` untuk memverifikasi seluruh container menyala tanpa error
- [x] 4.2 Verifikasi keberadaan ekstensi `vector` di database dan login akun admin `admin@bumn.go.id` pada http://localhost:3001
