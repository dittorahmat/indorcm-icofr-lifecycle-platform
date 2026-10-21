# Design

## Context

See `proposal.md` for motivation. The predecessor change (`add-tenant-b-worker-deployment`) established the current pattern:

- one checked-in Wrangler config per instance (`wrangler.jsonc`, `wrangler.demo.jsonc`);
- `vite.config.ts` selects the config via `WRANGLER_CONFIG`, defaulting to the primary;
- deployment points at the generated artifact `dist/<worker_name_with_underscores>/wrangler.json`;
- `scripts/clone-identity-to-tenant.ts` clones identity only, refuses `--apply` when source equals target, compares hashes across both databases, and enumerates content tables from `pg_tables`;
- `scripts/__tests__/deployment-config.test.ts` asserts the shared-key contract for the demo config only;
- `docs/DEPLOYMENT-MULTI-INSTANCE.md` documents a two-instance matrix.

Constraints that shape this change:

- `wrangler.jsonc` is marked DO NOT MODIFY and is read by the Vite Cloudflare plugin.
- The plugin derives the artifact directory from the Worker name (`-` becomes `_`), so the path is not configurable.
- `.env` is local (not committed) and has already been re-keyed to `DEMO_DATABASE_URL` and `TEST_DATABASE_URL`; `TARGET_DATABASE_URL` no longer exists. `SOURCE_DATABASE_URL` points at the primary and the test host is distinct from both other databases.
- The demo database now holds content, so it is no longer a safe accidental clone destination.
- The clone script loads `.env` itself via dotenv; shell variables are not populated from `.env`.
- The test database is still pristine: zero tables in the `icofr` schema, one extension installed, and the role resolves `"$user", public`. The primary and demo roles resolve `icofr, public`. The Worker opens `postgres(dbUrl)` without setting a search path, so schema resolution is a bootstrap responsibility, not a runtime one.

## Goals / Non-Goals

**Goals:**

- `icofr-test` behaves exactly like `icofr-demo`: same isolation, identity-only bootstrap, production gate, and auto-deploy from `main`.
- `icofr-test` is usable immediately after apply: it loads, accepts a cloned login, and can persist a record and an upload without manual database setup.
- Provisioning cannot silently target the wrong database.
- Every Wrangler config in the repo is covered by the deployment-contract check.
- The runbook describes N instances without a new copy of the bootstrap procedure per instance.

**Non-Goals:**

- No generated Wrangler configs, instance manifest, or config templating.
- No change to `wrangler.jsonc`, runtime request handling, API routes, or database schema.
- No new dependency, custom domain, or change to the demo/primary data.
- No archiving of the predecessor change inside this change (recorded in the migration plan instead).

## Decisions

### 1. Checked-in config plus per-instance scripts (copy the pattern)

Each instance keeps a reviewable config file and its own `build:<instance>` / `deploy:<instance>` scripts, which name the generated artifact explicitly.

- Why: the Vite plugin needs a real file path, the repo guardrail requires an explicit artifact, and a one-line diff per instance is reviewable.
- Alternatives rejected: a generator or manifest would add a second source of truth and hide config changes; a single config with Wrangler `env` blocks would require modifying the frozen primary config and rethinking secret scoping.

### 2. Deployment-contract test becomes table-driven and scans for configs

The test enumerates `wrangler.jsonc` plus every `wrangler.*.jsonc`, asserts shared keys against the primary, and asserts unique Worker name, bucket, and auth origin per instance. A config that is not in the table fails the test.

- Why: a third copy of the `describe` block would not protect the fourth instance; the scan is what makes the invariant scale.
- Alternatives rejected: asserting only that `name` differs (a typo in both name and bucket could pass); deriving expectations from the config itself (tautological).

### 3. `--target-env <NAME>` selects the clone destination

The clone resolves its target from an explicitly named environment variable (for example `TEST_DATABASE_URL`) after dotenv loads `.env`. There is no default target. Unknown names fail before connecting.

- Why: a generic `TARGET_DATABASE_URL` becomes ambiguous at three databases, and shell variables cannot read `.env` values.
- Alternatives rejected: keeping `TARGET_DATABASE_URL` (ambiguous default); `--target <url>` (leaks credentials into shell history and process listings); one wrapper script per instance (duplicated code for the same behavior).

### 4. Pre-write content guard and target disclosure

Before any write, the clone prints the resolved source and target hosts (never the full URL) and verifies that all non-identity, non-operational content tables are empty. A non-empty target fails with the offending table names.

- Why: the demo database now contains content. Today's order (write, then verify) would upsert identity rows into the wrong instance and revert its local role/password changes before failing.
- Alternatives rejected: relying on post-write verification (too late); a `--force-nonempty` escape hatch (no legitimate use for this flow).

### 5. Per-instance `.env` names; primary stays `DATABASE_URL`

`DATABASE_URL` remains the primary database for every existing consumer. Non-primary databases are named after their instance (`DEMO_DATABASE_URL`, `TEST_DATABASE_URL`); the generic target key is removed.

- Why: the name of the variable should identify the instance, not the role "target"; this is what prevents a swap during future provisioning.
- Alternative rejected: adding `TARGET_TEST_DATABASE_URL` next to `TARGET_DATABASE_URL` (two naming schemes, one of them ambiguous).

### 6. Instance parity with demo, including credentials policy

`icofr-test` reuses the same construction as demo: identity cloned from the primary, empty content, fresh `BETTER_AUTH_SECRET`, pooled database URL as a Worker secret, shared `GEMINI_API_KEY`, `ENV=production`, `SKIP_LICENSE=true`, and `BETTER_AUTH_URL` in `vars`.

- Why: the requested behavior is "exactly like demo"; deviating on guards or identity would create a second, undocumented deployment mode.
- Consequence: the third database also holds cloned production identities. This is the accepted demo policy, not a new decision; changing it is out of scope.

### 7. Bootstrap pins the role `search_path` in the existing extensions script

`scripts/db-extensions.mjs` already runs once per instance against the target database. It will also execute `ALTER ROLE CURRENT_USER SET search_path TO icofr, public` after creating the extensions. The command is idempotent on the primary and demo, whose roles already resolve `icofr, public`.

- Why: `worker/db/index.ts` calls `postgres(dbUrl)` without a search path, and a fresh Neon role defaults to `"$user", public`. The test database confirms that default and has zero `icofr` tables; without the role setting the Worker would deploy but fail every query.
- Alternatives rejected: setting `search_path` per request (touches the runtime path and adds a round trip); encoding `options=-csearch_path` in the connection string (invisible, easy to drop when rotating the secret); a manual `psql` step (not available on every Windows host and easy to skip).
- Verification: a brand-new **direct and pooled** connection reports `icofr, public`, sees the application tables, and the primary/demo settings remain unchanged. A pooler backend opened before the role change can cache the old path; recycle or wait for it before deploying.

### 8. Auto-deploy remains dashboard-configured

The `icofr-test` build project uses the same commands as demo: build `npm run build`, environment `WRANGLER_CONFIG=wrangler.test.jsonc`, deploy `npx wrangler deploy -c dist/icofr_test/wrangler.json`, previews disabled.

- Why: the behavior must match demo, and Workers Builds settings have no repository representation.
- Verification: the next push to `main` must move all three deployment timestamps; until then, manual `npm run deploy:test` is the only proof.

### 9. Spec capability stays `tenant-deployment`

This change adds requirements to the same capability as the predecessor. The predecessor is complete but unarchived, so its spec exists only inside its change directory. Requirements here are additive and self-contained, and the migration plan records the archive order.

- Why: a second capability for the same domain would split the deployment contract.
- Alternative rejected: duplicating the predecessor's full requirements into this delta (archive-time duplication).

## Risks / Trade-offs

- **Wrong clone target** → named target variable, same-database refusal, pre-write content guard, and host disclosure before writing.
- **Wrong DDL target** (`drizzle-kit` reads `DATABASE_URL`) → the runbook loads the named instance URL into the process environment for that command only, strips `-pooler` for direct DDL, prints the host, and clears the variable afterwards. A bootstrap wrapper is deliberately out of scope (no second DDL path).
- **Missing role search_path** → the bootstrap script pins `icofr, public`; a fresh direct and pooled connection must report it before deployment. Without it, the Worker starts but every query fails against `public`. A pooler backend created before the change can keep the old value until recycled.
- **Secret or origin leak into config** → the contract test asserts that no secret names appear and that `BETTER_AUTH_URL` is the instance's own host.
- **Missing `WRANGLER_CONFIG` in the build project** → the deploy command points at a path that only exists when the demo/test config was built; a missing artifact fails the deploy instead of overwriting the primary. This is also asserted by the contract test.
- **Deployment contract only covers checked-in configs** → a hand-created config inside the repo is caught by the scan; a Worker created outside the repo is out of scope.
- **Three databases drift on schema** → release checklist applies the schema sync to every instance and marks unsynchronized ones out of date (ADR 0009).
- **Archive ordering** → archiving this change before the predecessor would create `tenant-deployment` from this delta alone. The runbook/PR records: archive the predecessor first, or archive both in the same session.

## Migration Plan

1. Land the config, scripts, test, and documentation changes.
2. Preflight the test database: distinct host, zero `icofr` tables, default search path.
3. Load `TEST_DATABASE_URL` into the process environment for the DDL commands only (never echo it), strip `-pooler` for the direct connection, then run `npm run db:extensions` (extensions + role search path), `npx drizzle-kit push --force`, and `npm run db:check`.
4. Verify on a fresh connection: `search_path` is `icofr, public`, all application tables exist in `icofr`, both extensions are present, and no application table is in `public`.
5. Clone identity: dry run → `--target-env TEST_DATABASE_URL --apply` → verify counts, hashes, and empty content.
6. Create the R2 bucket, deploy the Worker once, then set the three Worker secrets.
7. Smoke-test before connecting the build project: `/` and `/api/health` 200, cloned login, empty content, create/read/delete a record, upload/download/delete a document, origin isolation.
8. Connect the Cloudflare build project with the demo-equivalent settings; the next push to `main` verifies auto-deploy.
9. Rollback: `wrangler rollback` the test Worker; the test database and bucket are disposable and referenced by no other instance. Reverting the repository change removes the config/scripts and leaves the existing two instances untouched.

## Open Questions

- Whether to keep the demo database's current content as the reference for future provisioning (it is no longer pristine). This does not affect this change: the clone source is the primary and the test database starts empty.
