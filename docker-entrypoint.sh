#!/bin/sh
set -e

echo "🔌 Ensuring DB extensions (vector, pg_trgm, ADR-0003)..."
psql "$DATABASE_URL" -f scripts/db-extensions.sql || true

echo "🔄 Running Drizzle Database Migrations..."
bun run drizzle-kit push --config=drizzle.config.ts || true

echo "🌱 Running Seed Initial Admin & Master Data..."
bun run scripts/run-seed.ts || true

echo "🚀 Starting IndoRCM On-Premise Server..."
exec bun run server.js
