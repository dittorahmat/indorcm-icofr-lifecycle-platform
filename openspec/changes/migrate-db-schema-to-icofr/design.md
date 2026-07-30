# Design: Migrate Database Schema to Dedicated `icofr` Schema

## Technical Architecture

### 1. Drizzle Schema Refactor (`worker/db/schema.ts`)
Menggunakan `pgSchema` dari `drizzle-orm/pg-core` untuk membungkus seluruh tabel aplikasi ke skema `icofr`:
```typescript
import { pgSchema } from "drizzle-orm/pg-core";

export const icofrSchema = pgSchema("icofr");

export const user = icofrSchema.table("user", { ... });
export const rcms = icofrSchema.table("rcms", { ... });
// ... seluruh tabel didaftarkan ke icofrSchema
```

### 2. Drizzle Configuration (`drizzle.config.ts`)
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./worker/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["icofr"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 3. Database Migration Strategy (`scripts/migrate-to-icofr-schema.ts`)
Skrip migrasi otomatis akan menjalankan SQL berikut:
1. `CREATE SCHEMA IF NOT EXISTS icofr;`
2. Memindahkan setiap tabel yang ada di skema `public` ke `icofr`:
   `ALTER TABLE public.<table_name> SET SCHEMA icofr;`
3. Mengatur `search_path` pada user database yang dipakai aplikasi:
   `ALTER USER <db_user> SET search_path TO icofr, public;`

### 4. Cross-App / Cross-Server Access Template (`scripts/setup-cross-app-user.sql`)
Script SQL untuk menyiapkan role/user luar yang ingin terkoneksi:
```sql
-- Buat user khusus aplikasi luar
CREATE USER external_app_user WITH PASSWORD 'StrongPassword123!';

-- Berikan izin akses ke skema icofr
GRANT USAGE ON SCHEMA icofr TO external_app_user;

-- Berikan izin SELECT (Read-Only) pada seluruh tabel icofr
GRANT SELECT ON ALL TABLES IN SCHEMA icofr TO external_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA icofr GRANT SELECT ON TABLES TO external_app_user;

-- Atur search_path default user tersebut
ALTER USER external_app_user SET search_path TO icofr, public;
```

## Risks & Mitigation
- **Risk**: Enums PostgreSQL masih berada di skema `public`.
  - **Mitigation**: Pindahkan enum `owner_acceptance` ke skema `icofr` menggunakan `ALTER TYPE public.owner_acceptance SET SCHEMA icofr;`.
- **Risk**: Perubahan skema merusak query eksisting.
  - **Mitigation**: Penetapan `search_path TO icofr, public` menjamin query tanpa qualifier skema tetap menemukan tabel di `icofr`.
