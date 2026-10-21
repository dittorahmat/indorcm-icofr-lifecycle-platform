# Proposal

## Why

Production runs as a single Cloudflare Worker (`icofr`) bound to one Neon database, so every prospective client shares one dataset. We need a second, fully isolated instance (`icofr-demo`) that serves different content from its own Neon project while running the exact same code and branding, without forking the repository or maintaining a second UI.

## What Changes

- Add a second Wrangler configuration (`wrangler.demo.jsonc`) that reuses the same worker entrypoint, assets pipeline, Durable Object class, and compatibility flags, but declares a distinct Worker name, a distinct R2 bucket, and `ENV=production`.
- Make the Vite build target-selectable (`WRANGLER_CONFIG`) so one command produces the artifact for either instance; the existing `wrangler.jsonc` stays untouched.
- Add a dry-run-first identity clone script (`scripts/clone-identity-to-tenant.ts`) that copies `organization`, `business_entities`, `departments`, `user`, `account`, `member`, and `user_preferences` from the current database to the new one, preserving IDs and PBKDF2 password hashes, and explicitly excludes ICOFR content, sessions, notifications, and audit logs.
- Standardize tenant database bootstrap: enable `vector` + `pg_trgm`, synchronize the schema into the `icofr` schema (`drizzle-kit push`; the versioned chain is not replayable yet, see ADR 0009), verify with `db:check`, and never run the demo `seedDatabase` on a tenant database.
- Document and enforce secret placement per Worker: `DATABASE_URL` (pooled), `BETTER_AUTH_SECRET` (new), `BETTER_AUTH_URL` (new workers.dev host), AI keys as configured.
- Register the second Worker as a Cloudflare Workers Builds project connected to this repository and deploying automatically from `main`.
- Record the operational consequence that schema migrations remain a release step for both databases; deployments alone never apply DDL.

## Capabilities

### New Capabilities

- `tenant-deployment`: How the platform is deployed as multiple isolated instances from one source tree — build target selection, per-instance Worker/R2/secret configuration, tenant database bootstrap with identity-only cloning, production safety gates, and auto-deploy behavior.

### Modified Capabilities

<!-- None: no existing capability's required behavior changes. -->

## Impact

- **Configuration**: new `wrangler.demo.jsonc`; `vite.config.ts` reads `WRANGLER_CONFIG`; `package.json` gains tenant build/deploy scripts.
- **Scripts**: new `scripts/clone-identity-to-tenant.ts` (reads `SOURCE_DATABASE_URL` and `TARGET_DATABASE_URL`).
- **Infrastructure**: new Neon project, new R2 bucket `icofr-documents-demo`, new Cloudflare Worker `icofr-demo`, new Workers Builds project, new secret set.
- **Runtime code**: `worker/auth.ts` now resolves trusted origins via `worker/lib/trusted-origins.ts` (each instance trusts only its own `BETTER_AUTH_URL`; `TRUSTED_ORIGINS` covers custom domains), so the demo host cannot trust the primary origin by accident. No other request-handling change.
- **UI**: no visual change; both instances build from the same compiled assets.
- **Operations**: every merge to `main` deploys both instances; the schema sync (`drizzle-kit push`) must be executed against both databases before a schema-dependent release is considered live.
