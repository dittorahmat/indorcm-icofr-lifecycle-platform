#!/bin/sh
set -e

echo "🔄 Running Drizzle Database Migrations..."
bun run drizzle-kit push --config=drizzle.config.ts || true

echo "🌱 Running Seed Initial Admin & Master Data..."
bun run scripts/run-seed.ts || true

echo "🚀 Starting IndoRCM On-Premise Server..."
exec bun run server.js
