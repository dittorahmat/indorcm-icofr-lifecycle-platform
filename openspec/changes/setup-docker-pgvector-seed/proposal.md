## Why

Saat melakukan deployment aplikasi IndoRCM via Docker, database PostgreSQL lokal memerlukan dukungan ekstensi `pgvector` untuk pencarian vektor/RAG. Selain itu, container database yang baru diinisialisasi membutuhkan migrasi skema Drizzle otomatis dan seeding data dasar (seperti akun administrator `admin@bumn.go.id`) agar aplikasi dapat langsung beroperasi (production-ready) tanpa langkah manual tambahan.

## What Changes

*   **PostgreSQL Image Update**: Mengganti image database standar `postgres:15-alpine` di `docker-compose.yml` menjadi `pgvector/pgvector:pg15`.
*   **Database Healthcheck & Service Readiness**: Menambahkan deklarasi `healthcheck` pada container `db` dan memperbarui `depends_on: { db: { condition: service_healthy } }` pada container `app`.
*   **Database Seeding Script**: Membuat runner CLI `scripts/run-seed.ts` yang mengadaptasi `worker/db/seed.ts` untuk mendukung eksekusi database PostgreSQL lokal (menggunakan driver `postgres`).
*   **Docker Entrypoint Automations**: Membuat skrip `docker-entrypoint.sh` dan memperbarui `Dockerfile` agar mengeksekusi `drizzle-kit push` dan `scripts/run-seed.ts` saat container pertama kali dinyalakan.

## Capabilities

### New Capabilities

- `docker-deployment`: Pengaturan lingkungan Docker containerized yang dilengkapi PostgreSQL dengan `pgvector`, auto-migration Drizzle, dan seeding data default administrator.

### Modified Capabilities

*Tidak ada.*

## Impact

- **Affected Files**: `docker-compose.yml`, `Dockerfile`, `docker-entrypoint.sh` (new), `scripts/run-seed.ts` (new).
- **Environment**: Container `indorcm-db` dan `indorcm-app`.
