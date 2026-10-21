// Cross-platform DB extension setup (psql alternative for machines without
// postgresql-client, e.g. Windows dev or minimal on-prem images).
// Mirrors scripts/db-extensions.sql; idempotent via IF NOT EXISTS.
//
// Also pins the connecting role's search_path to `icofr, public`. The Worker
// opens postgres(dbUrl) without a search path, and a fresh Neon database
// defaults to "$user", public — so this is a bootstrap requirement, not a
// convenience. Re-running on primary/demo rewrites the same value.
//
// Usage: DATABASE_URL=... npm run db:extensions  (reads DATABASE_URL from env).
import postgres from 'postgres';
import { databaseHost } from './lib/db-url.mjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[db:extensions] FAIL: DATABASE_URL is empty. Export it first (e.g. `set -a; . ./.env; set +a`).');
  process.exit(1);
}

const host = databaseHost(url);

try {
  const sql = postgres(url);
  console.log(`[db:extensions] Target host: ${host}`);
  await sql.unsafe('CREATE EXTENSION IF NOT EXISTS "vector"');
  await sql.unsafe('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
  await sql.unsafe('ALTER ROLE CURRENT_USER SET search_path TO icofr, public');
  await sql.end();
  console.log('[db:extensions] OK: vector + pg_trgm ensured; search_path pinned to icofr, public.');
} catch (e) {
  console.error(`[db:extensions] FAIL: ${e.code ?? 'UNKNOWN'} ${e.message ?? e}`);
  process.exit(1);
}
