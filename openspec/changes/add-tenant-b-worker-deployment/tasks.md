# Tasks

Execution note: tasks marked **(agent)** run non-interactively from the repository root. The Cloudflare CLI is already authenticated to the account that owns `icofr`, and `.env` already holds `DATABASE_URL`, `SOURCE_DATABASE_URL`, and `TARGET_DATABASE_URL`. Secret values are never printed to the transcript; they are piped from `.env` or generated in-process.

## 1. Tenant build target

- [x] 1.1 Add `wrangler.demo.jsonc` (`name: icofr-demo`, bucket `icofr-documents-demo`, `vars: { SKIP_LICENSE: "true", ENV: "production", BETTER_AUTH_URL: "https://icofr-demo.tech1solusi.workers.dev" }`, same `main`/compatibility/assets/DO/migration tag as `wrangler.jsonc`) with a header comment requiring sync with the primary config; verify with `npx wrangler deploy --dry-run -c wrangler.demo.jsonc` (dry run reports `icofr-demo`, no upload).
- [x] 1.2 Pass `configPath: process.env.WRANGLER_CONFIG ?? "wrangler.jsonc"` to the Cloudflare Vite plugin in `vite.config.ts`; verify a default `npm run build` still emits `dist/icofr/wrangler.json` with `"name":"icofr"`.
- [x] 1.3 Add `build:demo` and `deploy:demo` npm scripts (`deploy:demo` pinned to `dist/icofr_demo/wrangler.json`); verify `WRANGLER_CONFIG=wrangler.demo.jsonc npm run build` emits `dist/icofr_demo/wrangler.json` whose `name`, `r2_buckets[].bucket_name`, `assets.directory`, and `vars.BETTER_AUTH_URL` match the demo target.
- [x] 1.4 Confirm the primary path is untouched: rebuild with the default config and diff `dist/icofr/wrangler.json` against its pre-change content (no unexpected differences, name still `icofr`).

## 2. Identity clone script

- [x] 2.1 Implement `scripts/clone-identity-to-tenant.ts` under Node (same `postgres`/drizzle driver family as the existing backfill scripts, transactional), loading `.env` via dotenv, reading the source from `SOURCE_DATABASE_URL` or `DATABASE_URL` and the destination from `TARGET_DATABASE_URL`; dry-run by default, writes only with `--apply`; verify a dry run prints planned per-table counts and writes nothing (target counts unchanged).
- [x] 2.2 Copy `organization`, `business_entities`, `departments`, `user`, `account`, `member`, `user_preferences` in FK order preserving identifiers and `account.password`; verify with `--apply` that a copied password hash is byte-identical to the source row.
- [x] 2.3 Make the write path idempotent (conflict target on the primary key) and refuse `--apply` when source and target resolve to the same database; fail before writing if an email is already owned by a different user id. Verify a second `--apply` after inserting one test user in the source completes with matching counts and no duplicates in the target.
- [x] 2.4 Exclude `session`, `verification`, `notifications`, `audit_logs`, and all content tables; verify content counts in the target remain 0 after `--apply`.
- [x] 2.5 Print a source/target identity comparison and exit non-zero on mismatch; verify a clean zero-diff run by pointing both URLs at the same database.

## 3. Preflight (agent)

- [x] 3.1 Run `npx wrangler whoami` and verify the active account owns `icofr` (account `f09a2eb64166455bfb082af32c2ab00c`, OAuth token) before any write.
- [x] 3.2 Verify `.env` exposes `DATABASE_URL`, `SOURCE_DATABASE_URL`, `TARGET_DATABASE_URL` and that the target host is a pooled Neon endpoint; print key names and host shape only, never values.
- [x] 3.3 Verify the target bucket `icofr-documents-demo` and Worker `icofr-demo` do not exist yet (`npx wrangler r2 bucket list`, `npx wrangler deployments list --name icofr-demo`), so provisioning starts from a known state.

## 4. Provision the tenant database (agent)

- [x] 4.1 Derive the direct URL from `TARGET_DATABASE_URL` by removing `-pooler` from the host (keep it in a process-scoped variable) and run `npx cross-env DATABASE_URL="<direct>" npm run db:extensions`; verify `vector` and `pg_trgm` are enabled on the target.
- [x] 4.2 Apply the schema with `npx drizzle-kit push --force` on the direct URL (the versioned chain is not replayable on a fresh database: `0051_ai-cache-entries` targets `icofr` while earlier migrations create `public`, and the primary journal is empty); verify 50 tables in `icofr`, zero tables in `public`, and the `owner_acceptance` enum in `icofr`.
- [x] 4.3 Run `npx cross-env DATABASE_URL="<direct>" npm run db:check`; verify it passes (drift + extension locks).
- [x] 4.4 Verify the tenant database holds zero content rows (`rcms`, `controls`, `bpm_processes`, `csa_records`, `deficiencies`, `gl_rows`, `transaction_details` = 0) before any deploy.

## 5. Clone identity (agent)

- [x] 5.1 Run the clone dry run against the real source/target and verify the planned counts match the source identity tables.
- [x] 5.2 Run the clone with `--apply` and verify the target's `user`, `account`, `member`, `departments`, and `organization` counts equal the source, with content still 0.
- [x] 5.3 Re-run `--apply` immediately and verify it is idempotent (same counts, zero diff, exit 0).

## 6. Bucket, first deploy, and secrets (agent)

- [x] 6.1 Create the bucket with `npx wrangler r2 bucket create icofr-documents-demo`; verify it appears in `npx wrangler r2 bucket list` (treat an "already exists" response as success).
- [x] 6.2 Run `npm run deploy:demo`; verify the log names Worker `icofr-demo` (never `icofr`), the deploy succeeds, and `npx wrangler deployments list --name icofr-demo` shows the new deployment.
- [x] 6.3 Write secrets now that the Worker exists — `DATABASE_URL` = pooled `TARGET_DATABASE_URL`, `BETTER_AUTH_SECRET` = freshly generated 32-byte base64, `GEMINI_API_KEY` = value from `.env` — by piping values into `npx wrangler secret put <NAME> -c dist/icofr_demo/wrangler.json`; verify with `npx wrangler secret list -c dist/icofr_demo/wrangler.json` that all three names exist and no value is printed.
- [x] 6.4 Verify the deployed configuration carries `ENV=production` (dry-run config dump or dashboard vars) and that a dev-guard unit test asserts the production refusal (added in this change: `worker/lib/__tests__/dev-guard.test.ts`, 4 passing); record the result in the change summary.
- [x] 6.5 Smoke-test the live URL: `GET https://icofr-demo.tech1solusi.workers.dev/` returns 200 with the app shell and `POST /api/dev/re-seed` returns a client error (401/403/400), never 200.

## 7. End-to-end verification (agent, with user-confirmed login)

- [x] 7.1 Open `https://icofr-demo.tech1solusi.workers.dev` and verify the login page renders and the document title/asset bundle match the primary build.
- [x] 7.2 Sign in with a cloned account and verify role, level, language, and department match the primary instance; if the demo password is unknown, hand the credential check to the user and record the outcome.
- [x] 7.3 Verify dashboard, RCM, CSA, and scoping pages render their empty state (no seeded content) without console/API errors.
- [x] 7.4 Upload a document on the tenant host and verify the object exists only in `icofr-documents-demo`.
- [x] 7.5 Verify the regulatory report surfaces load on the tenant host (`/reports` 200 and `GET /api/reports/summary` 200 with the cloned Admin session) and that report/export code contains no hardcoded primary host; record that the codebase has no QR-code generator, so QR document verification cannot be exercised and remains a gap versus the product description.
- [x] 7.6 Verify the primary instance still serves its own data and bucket contents and still reports Worker name `icofr` after the demo deploy.
- [x] 7.7 Run the repo gates on touched files (`npm run type-check`, `npx eslint` on the touched files, `npm run check:loc -- vite.config.ts scripts/clone-identity-to-tenant.ts`, `npm run build`, `npm test`) and record LOC counts for every touched file in the change summary.

## 8. Documentation and release checklist

- [x] 8.1 Add `docs/DEPLOYMENT-MULTI-INSTANCE.md` with the instance matrix (Worker, host, database, bucket, secrets), the bootstrap order, the exact clone and deploy commands, and the secret placement rules; verify every documented command runs as written.
- [x] 8.2 Add the schema-sync release step to the release checklist (run `drizzle-kit push` with direct URLs against the primary and demo databases) and verify both databases are named explicitly, including the note that the versioned migration chain is not replayable today.
- [x] 8.3 Document rollback (`wrangler rollback` per Worker, disposable demo database/bucket) and the config-sync rule for `wrangler.demo.jsonc`; verify the rollback command resolves `icofr-demo`.

## 9. Review remediation (locking the invariants)

- [x] 9.1 Lock the duplicated Wrangler config with `scripts/__tests__/deployment-config.test.ts` (shared keys identical, Worker/bucket names, `ENV=production`, `BETTER_AUTH_URL`, no secrets in config, derived artifact path in `deploy:demo`).
- [x] 9.2 Extract clone decision logic to `scripts/lib/clone-identity.ts` and test it (`scripts/__tests__/clone-identity.test.ts`): schema-derived table names, pooled/direct equivalence, content-table enumeration, fail-closed hash verdict.
- [x] 9.3 Make the clone verification cross-database and fail closed: compare credential hashes from both databases, enumerate every non-identity table via `pg_tables`, refuse `--apply` when source == target, and fail before writing on email/id collisions.
- [x] 9.4 Isolate session origins per instance (`worker/lib/trusted-origins.ts` + `worker/lib/__tests__/trusted-origins.test.ts`) and document the `push`-vs-`migrate` decision in `docs/adr/0009-schema-sync-push-and-fresh-db-bootstrap.md` and the deployment runbook.

## Workflow follow-up

- Manual, dashboard-only: connect Worker `icofr-demo` under Settings → Build to this repository (build `npm run build`, deploy `npx wrangler deploy -c dist/icofr_demo/wrangler.json`, build env `WRANGLER_CONFIG=wrangler.demo.jsonc`, preview deployments disabled). Not required to open the site; required for automatic deploys from `main`.
- Archive the change after review and after both instances are verified in production.
- Revisit the deferred items in `design.md` → Open Questions: CI migration workflow, `ENV=production` on the primary Worker, and license bypass on the demo instance.
