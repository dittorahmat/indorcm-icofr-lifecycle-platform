# Design

## Context

See `proposal.md` for motivation. Current constraints that shape the approach:

- One Worker (`icofr`) is declared in `wrangler.jsonc`, which carries a "do not modify" guard and is the file the Cloudflare Vite plugin reads. The plugin emits a derived config at `dist/<worker-name>/wrangler.json` plus a redirect at `.wrangler/deploy/config.json` that `wrangler deploy` follows.
- All persistence goes through `DATABASE_URL` (`worker/db/index.ts`): `https://` URLs use the Neon HTTP driver, `postgres://` URLs use the Neon WebSocket pool. There is no Hyperdrive path, so a tenant database must be Neon-compatible.
- The R2 binding name and bucket name are static in the Worker config, and `worker/lib/storage.ts` has no per-tenant key prefix.
- Durable Object `GlobalDurableObject` is declared per script, so a second Worker gets its own namespace automatically.
- `worker/auth.ts` reads `BETTER_AUTH_URL` and already trusts it; `worker/app.ts` has a hardcoded CORS origin list used only for cross-origin calls.
- `worker/lib/dev-guard.ts` blocks `/api/dev/*` only when `ENV`/`NODE_ENV` equals `production`; the current production Worker does not set it.
- `worker/db/seed.ts` inserts demo ICOFR content (RCM, controls, BPM KUR, 200+ transactions) and resets all demo passwords to `'password'`.
- DDL truth is the versioned `drizzle/*.sql` sequence, applied with `drizzle-kit`; nothing applies migrations at deploy time.

## Goals / Non-Goals

**Goals:**

- Two instances, one codebase, one build pipeline, no fork and no branch split for code.
- Hard isolation of data: separate database, separate object storage, separate session secret.
- Tenant instance starts with zero ICOFR content but identical users, roles, departments, and login credentials.
- Deploying one instance can never mutate the other instance's Worker or bucket.
- New instances can be added later by repeating the same recipe with different names.

**Non-Goals:**

- Per-tenant branding, typography, or feature flags (both instances build the same assets).
- Runtime multi-tenancy inside one Worker (already possible via `organizationId`, but explicitly not the chosen isolation model here).
- Automatic database migration during deploy.
- Hyperdrive or non-Neon Postgres support.
- Data synchronisation between instances after the initial identity clone.

## Decisions

### 1. Second Wrangler config file instead of Wrangler environments

Create `wrangler.demo.jsonc` with `name: "icofr-demo"`, `bucket_name: "icofr-documents-demo"`, `vars: { SKIP_LICENSE: "true", ENV: "production", BETTER_AUTH_URL: "https://icofr-demo.tech1solusi.workers.dev" }`, and otherwise the same `main`, compatibility date/flags, assets rules, Durable Object binding and migration tag as `wrangler.jsonc`.

- **Why**: Wrangler environments would require editing `wrangler.jsonc`, which is guarded and shared with the Vite plugin. A sibling file keeps the primary deployment path byte-identical.
- **Alternative rejected**: `env.demo` blocks in `wrangler.jsonc` — less duplication, but touches the guarded file and changes the deploy semantics of the existing instance.
- **Alternative rejected**: a fork or a long-lived `release/demo` branch — duplicates merge work and was explicitly declined.

The duplicated file carries a header comment stating that `main`, compatibility flags, assets rules, Durable Object binding and migration tag must stay in sync with `wrangler.jsonc`; `scripts/__tests__/deployment-config.test.ts` locks that invariant (plus Worker name, bucket, `ENV`, `BETTER_AUTH_URL`, no secrets in config, and the artifact path used by the deploy script).

### 2. Target selection through the Vite plugin's `configPath`

`vite.config.ts` passes `configPath: process.env.WRANGLER_CONFIG ?? "wrangler.jsonc"` to `cloudflare()`. The `configPath` option exists in the installed plugin (`@cloudflare/vite-plugin` 1.9.4), so `WRANGLER_CONFIG=wrangler.demo.jsonc npm run build` produces `dist/icofr_demo/wrangler.json` with the tenant name and bucket substituted into the asset/DO/R2 bindings. The plugin normalizes the artifact directory to `icofr_demo` (underscore) while the Worker name inside stays `icofr-demo`.

- **Why**: one build pipeline, no duplicated Vite config, and the generated artifact is the single source for the deployable bindings.
- **Alternative rejected**: patching the generated JSON in a post-build script — brittle, duplicates the plugin's logic, and drifts when the plugin changes.

### 3. Deploy from the generated config path, not the redirect

Deploy with `wrangler deploy -c dist/<worker-name>/wrangler.json`. The npm script for the tenant resolves to `dist/icofr_demo/wrangler.json`.

- **Why**: `.wrangler/deploy/config.json` is overwritten by whichever build ran last. Depending on it means a tenant build followed by a primary build would silently deploy the wrong target. The generated config path is deterministic per target.
- **Consequence**: each tenant deploy must be preceded by its own build in the same invocation (the `deploy:*` scripts chain build then deploy).

### 4. Bucket per instance rather than key prefixing

Each instance binds its own R2 bucket. No code change to `worker/lib/storage.ts` or to the upload routes.

- **Why**: there is no tenant prefix in stored keys today; adding one touches every upload/download call site, while a separate bucket gives isolation at the binding level and a trivial rollback (delete the bucket).
- **Cost**: two buckets to monitor and back up.

### 5. Credentials per Worker, no shared auth state

Tenant Worker secrets: `DATABASE_URL` (pooled Neon URL) and a freshly generated `BETTER_AUTH_SECRET`; `BETTER_AUTH_URL=https://icofr-demo.tech1solusi.workers.dev` lives in the tenant config's `vars` so the host can never drift from the Worker name. AI keys are copied from the existing `.env` (`GEMINI_API_KEY`) unless a separate key is decided later.

- **Why**: `better-auth` signs sessions with the secret; a shared secret plus a shared cookie domain would allow cross-instance session confusion even with separate databases. A distinct secret makes sessions structurally non-portable.
- **Code change**: `worker/auth.ts` resolves trusted origins through `worker/lib/trusted-origins.ts` — `BETTER_AUTH_URL` is the only trusted origin for a configured instance, so the demo never trusts the primary host. The primary origin is kept only as a fallback when `BETTER_AUTH_URL` is unset (local dev / unconfigured deployment); extra custom domains go through `TRUSTED_ORIGINS`. Locked by `worker/lib/__tests__/trusted-origins.test.ts`.
- **CORS list in `worker/app.ts` left untouched**: the SPA calls the API same-origin; the hardcoded list only matters for cross-origin consumers.

### 6. Bootstrap database before first deploy, identity clone before first login

Order: extensions → schema sync → schema verification → identity clone → secret configuration → deploy.

- **Why**: the Worker boots against whatever schema exists; deploying first produces 500s on every data-backed route. The clone needs the target schema (FKs to `organization`/`departments`/`user`) but no content.
- **Schema sync, not migration replay**: the target schema is applied with `drizzle-kit push` (`schemaFilter: ["icofr"]`), which creates the `icofr` schema, the enum, and all 50 tables exactly as `worker/db/schema/**` declares. Replaying `drizzle/*.sql` fails on a fresh database: migration `0051_ai-cache-entries` writes to `"icofr"` and references `"icofr"."organization"`, while migrations `0000`–`0050` create objects in `public`, and the schema move between them was performed manually on the primary database. The primary's `drizzle.__drizzle_migrations` table is empty, so `drizzle-kit migrate` is not the operational path anywhere in this repo today.
- **Promotion is blocked**: `scripts/db-extensions.sql` enables `vector` (used by `document_chunks`/embeddings) and `pg_trgm` (trigram search indexes); without them the schema sync fails.
- **Search path**: the demo database role gets `search_path = icofr, public` (same as the primary) so unqualified SQL in routes/scripts resolves to the application schema.

### 7. Identity clone is a scripted, idempotent, dry-run-first migration

`scripts/clone-identity-to-tenant.ts` reads the source from `SOURCE_DATABASE_URL` **or, when that is unset, from the existing `DATABASE_URL`**, and reads `TARGET_DATABASE_URL` for the destination; it prints planned row counts and only writes when `--apply` is passed. The repository `.env` keeps its current shape: `DATABASE_URL` is not renamed, replaced, or repurposed — every existing consumer (`drizzle.config.ts`, backfill scripts, local dev) keeps working unchanged. Both connections are opened on the direct (non-`-pooler`) endpoint and pin `search_path` to `icofr, public`, because the Neon pooler does not preserve session-level settings.

Copied, in FK order, with identifiers and hashes preserved:
`organization` → `business_entities` → `departments` → `user` → `account` → `member` → `user_preferences`.

Excluded: `session`, `verification`, `notifications`, `audit_logs`, all ICOFR content tables, `documents`/`document_*`, `ai_cache_entries`, `system_licenses`, `applications`/`application_documents`, `migration_sessions`, `wbs_reports`, `soc_*`, `vendors`.

- **Why copy hashes instead of re-hashing**: `worker/auth.ts` verifies the `pbkdf2$<iterations>$<salt>$<hash>` format, so copying `account.password` preserves every password exactly without knowing plaintext. Re-seeding would force every user to a known demo password.
- **Why upsert**: re-running after new hires in the primary instance must not fail on existing ids. The upsert keys on the primary key only; an email already owned by a different id would create a second login, so the script fails before writing and asks the operator to resolve it.
- **Why two variables instead of one**: the clone is the only operation that touches two databases at once. `DATABASE_URL` stays the primary instance's connection string; only this command needs a second value, supplied for that invocation (shell env var or an added `.env` key). No other script or config changes.
- **Verification**: per-table source/target counts, cross-database credential-hash comparison (reads both databases; fails closed when no row is comparable), and an emptiness check over **every** non-identity content table discovered from `pg_tables` (runtime tables such as `session`/`notifications`/`audit_logs` are excluded). `--apply` is refused when source and target are the same database. Decision logic lives in `scripts/lib/clone-identity.ts` with tests in `scripts/__tests__/clone-identity.test.ts`.
- **Explicitly not used**: running `seedDatabase` against the tenant, because it injects demo content and resets passwords.

### 8. Production gate enabled on the tenant

`ENV: "production"` goes into the tenant config vars so `assertDevAllowed` refuses `/api/dev/re-seed` and `/api/dev/purge-all`.

- **Why**: the tenant database holds real client data; the dev routes can delete every content table.
- **Scope note**: the primary Worker currently lacks this var (gate permissive). Enabling it there is proposed as a follow-up, not bundled into this change, to keep behaviour of the existing instance unchanged.

### 9. Two Workers Builds projects, both from `main`

Each Cloudflare Workers Builds project connects to this repository. The tenant project sets the build environment variable `WRANGLER_CONFIG=wrangler.demo.jsonc`, runs the standard build command, and deploys with `npx wrangler deploy`. Preview deployments are disabled for the tenant project.

- **Why**: the user chose automatic deployment from `main`; a single merge keeps both instances on the same commit.
- **Accepted trade-off**: a regression merged to `main` reaches both instances simultaneously; separation is a data boundary, not a release boundary.
- **Safety**: the tenant project must never fall back to the default config. If `WRANGLER_CONFIG` is missing, the build emits `icofr` and the deploy would overwrite the primary Worker — verified once by inspecting the first tenant build log for the Worker name before enabling further merges.

### 10. Schema sync remains an explicit release step

No schema change runs in the build or deploy command. The release checklist gains a step applying the project's schema to every instance database with `npx drizzle-kit push` (the command the repository already uses to apply `worker/db/schema/**`, with `schemaFilter: ["icofr"]`).

- **Why**: build machines would need production database credentials, and a failed schema change mid-deploy leaves a half-updated fleet. Keeping DDL in the operator's hands matches the repository rule that `drizzle/*.sql` plus `worker/db/schema/**` are the only schema sources.
- **Reality check**: `drizzle-kit migrate` cannot be the release command today — the primary database's `drizzle.__drizzle_migrations` journal is empty and the versioned chain is not replayable on a fresh database (see decision 6). Making the migration chain replayable is a separate change.
- **Use the direct (unpooled) Neon URL for the schema command; use the pooled URL for the Worker binding.**

### 11. Secret placement (no secret enters the repository)

| Secret/var | Where it lives |
|---|---|
| `DATABASE_URL` (pooled) | Cloudflare dashboard → Workers & Pages → `icofr-demo` → Settings → Variables and Secrets → add as **Secret**; or `npx wrangler secret put DATABASE_URL -c dist/icofr_demo/wrangler.json` after the Worker exists |
| `BETTER_AUTH_SECRET` | Same place, new random value (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Not a secret: declared in `wrangler.demo.jsonc` → `vars` as `https://icofr-demo.tech1solusi.workers.dev` |
| `GEMINI_API_KEY` and `AI_*` | Same place as `DATABASE_URL`; copied from the existing `.env` |
| `ENV`, `SKIP_LICENSE` | Already in `wrangler.demo.jsonc` as non-secret vars |

Secret writes require the Worker to exist, so the deliberate order is: create bucket → first deploy → write secrets → verify. Secrets take effect on the deployed version immediately; no redeploy is needed.

For the local bootstrap commands (`db:extensions`, `drizzle-kit migrate`, clone script), the tenant URL is passed as a shell environment variable for that invocation; the existing `.env` keeps `DATABASE_URL` pointing at the primary database and is never rewritten. `scripts/db-extensions.mjs` and `scripts/db-check.mjs` read `process.env` only (no `.env` loading), while `drizzle-kit` loads `.env` itself — so the tenant URL is supplied explicitly on the command line rather than by editing the file. The direct/unpooled URL is used only for those commands; the pooled URL is the one stored as the Worker secret. No connection string is committed and no new `.dev.vars` file is added.

## Risks / Trade-offs

- **Worker name collision overwrites the primary instance** if the tenant build loses `WRANGLER_CONFIG` → inspect the first tenant build log for `icofr-demo`; keep `deploy:demo` pinned to `dist/icofr_demo/wrangler.json`; `wrangler rollback` is the recovery path.
- **Schema drift between the two databases** → the release checklist runs `drizzle-kit push` against both databases; `db:check` guards `schema.ts` against snapshot drift before release.
- **Versioned migration chain is not replayable on a fresh database** (0051 targets `icofr` while 0000–0050 create `public`; the move was manual) → bootstrap uses `drizzle-kit push`, documented in design decision 6. Repairing the chain is recorded as a follow-up, not attempted here.
- **Cloned demo passwords stay weak** (`password` for demo users) → accepted for now because fidelity to the primary instance was requested; flag as a follow-up credential-rotation task before real client use.
- **Regression reaches both instances at once** → accepted by choosing auto-deploy from `main`; recovery is `wrangler rollback`, which is per-instance.
- **Duplicated Wrangler config drifts** (compatibility date, DO migration tag, assets rules) → request-shape keys, Worker name, bucket, `ENV`, and the deploy artifact path are locked by `scripts/__tests__/deployment-config.test.ts`; a rename or drift fails the suite instead of silently targeting the wrong Worker.
- **Bucket must exist before the first tenant deploy** → provisioning task is ordered before deployment; a missing binding fails the deploy rather than silently writing elsewhere.
- **`worker/app.ts` CORS list does not include the tenant host** → no impact for same-origin SPA traffic; becomes relevant only if a custom domain plus cross-origin embedding is added later.
- **Two Workers share the account's Workers/Neon quotas** → monitor usage after cutover; no architectural change needed.

## Migration Plan

1. Land the repo changes (tenant Wrangler config with `BETTER_AUTH_URL` in `vars`, `configPath`, npm scripts, identity clone script) and confirm the default build still targets `icofr`.
2. Derive the direct (unpooled) URL from the pooled `TARGET_DATABASE_URL` (drop `-pooler` from the host), then run extensions → `drizzle-kit push --force` (schema sync into `icofr`) → `db:check`. Verify 50 tables in `icofr`, zero tables in `public`, and the `owner_acceptance` enum in `icofr`. `scripts/db-extensions.mjs` and `scripts/db-check.mjs` read `process.env` only, so the value is passed per command.
3. Run the identity clone (dry run, then `--apply`) using `SOURCE_DATABASE_URL` from `.env`; confirm counts match the primary identity tables.
4. Create bucket `icofr-documents-demo`, then deploy with `npm run deploy:demo` (build → `wrangler deploy -c dist/icofr_demo/wrangler.json`). The Worker and its `workers.dev` URL exist after this step.
5. Write secrets now that the Worker exists: `DATABASE_URL` (pooled target), a generated `BETTER_AUTH_SECRET`, and `GEMINI_API_KEY` from `.env`. Verify login, empty content, document upload location, QR verification host, and that `/api/dev/re-seed` is refused.
6. Connect the Worker to Git under Settings → Build (build command `npm run build`, deploy command `npx wrangler deploy -c dist/icofr_demo/wrangler.json`, build env `WRANGLER_CONFIG=wrangler.demo.jsonc`, previews disabled) so later merges to `main` deploy automatically.
7. Rollback: tenant Worker → `wrangler rollback` or delete the build project; tenant database and bucket are disposable and never referenced by the primary instance.

## Open Questions

- Whether to repair the versioned migration chain so `drizzle-kit migrate` becomes replayable on a fresh database (0051 depends on an `icofr` schema move that no migration performs, and the primary journal is empty). Deferred to its own change; this change documents `drizzle-kit push` as the bootstrap and release command.
- Whether to add a CI workflow that applies migrations to both databases after a successful deploy (would require `DATABASE_URL_A`/`DATABASE_URL_B` as GitHub secrets). Deferred: the manual checklist is the interim control and the specs do not depend on the answer.
- Whether to enable `ENV=production` on the primary Worker as well (closes the same permissive dev gate there). Deferred to its own change.
- Whether the tenant instance should keep license bypass (`SKIP_LICENSE=true`) once it serves a real client. Deferred until licensing requirements for the second instance are decided.
