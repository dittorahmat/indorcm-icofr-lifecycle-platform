# 0009 — Schema sync via `drizzle-kit push` for fresh-database bootstrap

- **Status:** Accepted (with tracked debt)
- **Date:** 2026-10-21
- **Context:** Provisioning the second instance (`icofr-demo`) against a brand-new Neon database.

## Problem

`AGENTS.md` names `drizzle/*.sql` as the only source of DDL and requires versioned
migrations. In this repository that chain cannot be replayed on an empty database:

- `drizzle/0051_ai-cache-entries.sql` writes to schema `icofr` and references
  `"icofr"."organization"`, while `0000`–`0050` create their objects in `public`.
- The `public` → `icofr` move on the primary was performed manually
  (`scripts/migrate-schema-to-icofr.ts`).
- `drizzle.__drizzle_migrations` on the primary has **zero** rows, so even the
  primary does not claim a migration baseline.

Running `drizzle-kit migrate` on a fresh database therefore fails or produces an
empty `icofr` schema, and there is no baseline to start from.

## Decision

1. `worker/db/schema/**` (Drizzle) remains the declarative source of truth for the
   schema, and `drizzle/*.sql` remains the reviewed DDL history.
2. **Operational schema sync** for any database (primary or additional instance)
   uses `npx drizzle-kit push` with `schemaFilter: ["icofr"]`. A fresh instance is
   bootstrapped by: extensions (`npm run db:extensions`) → `push --force` →
   `npm run db:check`.
3. Runtime DDL is still prohibited: no `ALTER TABLE` at request time,
   no `/dev/fix-db`, no one-off DDL in routes.
4. Every additional instance repeats the same bootstrap and is verified by
   `npm run db:check`; a clone is not considered complete until the check passes.

## Consequences

- A new instance can be provisioned reliably today without hand-written DDL.
- `push` compares the live database to the TypeScript schema; it is not a
  reviewable artifact. Reviewers therefore rely on the schema diff in the PR plus
  the `db:check` drift gate.
- **Tracked debt:** repair the versioned chain (baseline `0000` against `icofr`,
  make `0051` replayable, record the baseline in `__drizzle_migrations`) and then
  switch new-instance bootstrap from `push` to `migrate`. Until that lands, this
  ADR is the recorded exception — not an invitation to add ad-hoc DDL.
