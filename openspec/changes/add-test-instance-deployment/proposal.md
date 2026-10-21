# Proposal

## Why

`icofr-demo` proved that a second, fully isolated instance can run from the same source tree with the same identity and zero content. A third instance, `icofr-test`, is now needed with **exactly the demo behavior** (own Worker, database, bucket, auth secret, production guards, auto-deploy from `main`).

At two instances the per-instance surface was safe to copy. At three, the generic `TARGET_DATABASE_URL` becomes ambiguous: `.env` now holds two non-primary databases, and `icofr-demo` already contains content. A mistaken clone target can silently upsert identity rows into the wrong instance before verification fails. The provisioning path therefore needs an explicit target and a pre-write guard, not another copy of the same defaults.

## What Changes

- Add the third instance `icofr-test`:
  - Worker `icofr-test`, host `https://icofr-test.tech1solusi.workers.dev`
  - `wrangler.test.jsonc` with its own R2 bucket `icofr-documents-test`
  - new Neon database (connection string already provisioned) and a fresh `BETTER_AUTH_SECRET`
  - same per-instance `vars` as demo: `ENV=production`, `SKIP_LICENSE=true`, `BETTER_AUTH_URL`
  - identity cloned from the primary, content empty, auto-deploy from `main`
- Pin the instance database role's `search_path` to `icofr, public` during bootstrap. The Worker opens connections without a per-request search path, and a fresh Neon database currently resolves `"$user", public` with zero application tables; without this step the Worker deploys but cannot read its own schema.
- Define "ready" for `icofr-test`: `/` and `/api/health` return 200, a cloned credential account can sign in, the dashboard renders without a license gate, one record and one document can be created and read back, content is otherwise empty, and origin isolation still rejects the other instances.
- Replace the single generic target variable in `.env` with per-instance names (`DEMO_DATABASE_URL`, `TEST_DATABASE_URL`); `DATABASE_URL` remains the primary and `TARGET_DATABASE_URL` is removed.
- Make the identity clone target explicit:
  - `--target-env <NAME>` selects the named database (no default target)
  - `clone:identity` npm script added for operator convenience
  - the resolved target host is printed before any write (never credentials)
  - a pre-write check refuses to write when the target's content tables are not empty
  - same-database refusal and fail-closed hash verification stay
- Make the deployment contract test table-driven: every `wrangler*.jsonc` must be covered, with shared keys compared to the primary and unique Worker/bucket/auth-origin values asserted. A fourth config cannot exist without a test.
- Generalize the runbook from "primary + demo" to an instance matrix and a parameterized bootstrap flow.

## Capabilities

### New Capabilities

- `tenant-deployment`: how multiple isolated instances are configured, bootstrapped, verified, and released from one repository, including explicit-target identity cloning and per-instance deployment invariants.

### Modified Capabilities

_None. No existing product capability changes behavior; this is deployment and provisioning behavior, captured under `tenant-deployment`._

## Impact

- **Configuration**: new `wrangler.test.jsonc`; `package.json` gains `build:test` / `deploy:test`.
- **Scripts**: `scripts/clone-identity-to-tenant.ts` gains explicit target selection and a pre-write content check; `scripts/db-extensions.mjs` also pins the role `search_path`; new pure helpers and tests.
- **Tests**: `scripts/__tests__/deployment-config.test.ts` becomes table-driven and scans for uncovered configs; clone and bootstrap behavior gain focused tests.
- **Docs**: `docs/DEPLOYMENT-MULTI-INSTANCE.md`, `docs/agents/guardrails.md` (if the instance list is referenced), and `.env` key documentation.
- **External**: Neon database, R2 bucket, Worker secrets, and a Cloudflare Build project for `icofr-test`.
- **Not affected**: runtime request handling, API routes, database schema, dependencies, and the primary/demo Workers' data.
- **Prerequisite note**: `icofr-demo` was delivered by the still-unarchived change `add-tenant-b-worker-deployment`. This change adds requirements to the same `tenant-deployment` capability; archive the predecessor before or alongside this change so the main spec receives both requirement sets in order.
