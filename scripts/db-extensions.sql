-- DB extensions for IndoGRC Pro (on-prem bootstrap + fresh Neon projects).
-- Run AS SUPERUSER (or database owner) BEFORE `drizzle-kit push`:
--   psql "$DATABASE_URL" -f scripts/db-extensions.sql
-- or via npm:  npm run db:extensions
-- `vector` is required by migrations 0041/0042 (RAG embeddings, pre-existing
-- gap); `pg_trgm` is required by migration 0050 (Trigram Search, ADR-0003).
-- Both images (`pgvector/pgvector:pg15`) and Neon ship these extensions —
-- they only need enabling. Idempotent via IF NOT EXISTS.
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
