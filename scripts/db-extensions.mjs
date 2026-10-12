// Cross-platform DB extension setup (psql alternative for machines without
// postgresql-client, e.g. Windows dev or minimal on-prem images).
// Mirrors scripts/db-extensions.sql; idempotent via IF NOT EXISTS.
// Usage: DATABASE_URL=... npm run db:extensions  (reads DATABASE_URL from env).
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[db:extensions] FAIL: DATABASE_URL is empty. Export it first (e.g. `set -a; . ./.env; set +a`).');
  process.exit(1);
}

try {
  const sql = postgres(url);
  await sql.unsafe('CREATE EXTENSION IF NOT EXISTS "vector"');
  await sql.unsafe('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
  await sql.end();
  console.log('[db:extensions] OK: vector + pg_trgm ensured.');
} catch (e) {
  console.error(`[db:extensions] FAIL: ${e.code ?? 'UNKNOWN'} ${e.message ?? e}`);
  process.exit(1);
}
