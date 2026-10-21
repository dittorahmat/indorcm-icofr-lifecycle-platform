# Tasks

## 1. Instance configuration and contract test

- [x] 1.1 Confirm the local `.env` contract: `DEMO_DATABASE_URL` and `TEST_DATABASE_URL` exist, `TARGET_DATABASE_URL` is absent, `SOURCE_DATABASE_URL` resolves to the primary host, and the test host differs from both primary and demo. Verify by printing host names and booleans only (never URLs or credentials) and record the result in the PR.
- [x] 1.2 Create `wrangler.test.jsonc` from `wrangler.demo.jsonc` with `name: icofr-test`, `r2_buckets[0].bucket_name: icofr-documents-test`, `vars.BETTER_AUTH_URL: https://icofr-test.tech1solusi.workers.dev`, and the demo-equivalent `ENV=production` / `SKIP_LICENSE=true`, keeping every shared key byte-identical. Verify with `npm run build:test` followed by `npx wrangler deploy --dry-run -c dist/icofr_test/wrangler.json` (the raw config lacks the Vite-injected assets directory) and confirm it prints the test Worker name and test bucket.
- [x] 1.3 Add `build:test` and `deploy:test` to `package.json`, mirroring demo: `cross-env WRANGLER_CONFIG=wrangler.test.jsonc bun run build` and `wrangler deploy -c dist/icofr_test/wrangler.json`. Verify `npm run build:test` emits that exact artifact and its `name` and bucket fields match `wrangler.test.jsonc`.
- [x] 1.4 Rewrite `scripts/__tests__/deployment-config.test.ts` as a table over `wrangler.jsonc` plus every `wrangler.*.jsonc`, with a directory scan that fails on an uncovered config. Assert shared keys against the primary, unique Worker name/bucket/auth origin, no secret names or values in `vars`, and an artifact path derived from each Worker name. Verify green for the three configs, then copy `wrangler.demo.jsonc` to an untracked `wrangler.zzz.jsonc`, confirm the failure names the uncovered file, delete the stub, and re-run green.

## 2. Explicit-target, fail-closed identity clone

- [x] 2.1 Add `--target-env <NAME>` to `scripts/clone-identity-to-tenant.ts`, resolving `process.env[NAME]` after dotenv loads and failing before any connection when the flag is missing, the name is unknown, or the variable is empty. Verify with unit tests for argument resolution plus `npm run clone:identity -- --target-env NOPE`, which must exit non-zero without opening a connection.
- [x] 2.2 Add the pre-write content guard: enumerate target content tables and refuse to proceed when any holds rows, naming the offending tables, in both dry-run and `--apply` modes. Verify with a unit test over the verdict logic and a dry run against `DEMO_DATABASE_URL` that exits non-zero before the identity phase.
- [x] 2.3 Print the resolved source and target hosts (never the full URL with credentials) before the plan and before `--apply`; keep the same-database refusal and cross-database hash verification. Verify by capturing a `TEST_DATABASE_URL` dry run and asserting the output contains the expected hosts but no `npg_` or password substring.
- [x] 2.4 Update the script header and usage examples to remove `TARGET_DATABASE_URL` and show `--target-env`, including the warning that `.env` is loaded in-process and shell variables cannot supply it. Verify with `Select-String` that no `TARGET_DATABASE_URL` remains in the script.

## 3. Deployment documentation

- [x] 3.1 Generalize `docs/DEPLOYMENT-MULTI-INSTANCE.md` to a three-instance matrix (primary/demo/test) covering Worker name, host, config file, database variable, R2 bucket, build/deploy script, and auth secret ownership. Verify every row matches the checked-in configs and `package.json`, and that the bootstrap steps are written once with the instance as a parameter.
- [x] 3.2 Update the bootstrap order to include the role `search_path` step in `db:extensions`, direct/unpooled DDL, safe loading of the named instance URL for one command, `drizzle-kit push --force`, `db:check`, and `--target-env` for the clone. Verify the commands reference existing npm scripts and that the ADR 0009 link resolves.
- [x] 3.3 Review `docs/agents/guardrails.md` §Deployment and update any two-instance wording or instance list so a fourth instance inherits the contract-test and explicit-target rules. Verify with a read-through and `Select-String` for stale "two instance"/"both instances" phrasing in the deployment section (product-spec prose is out of scope).

## 4. Test database bootstrap

- [x] 4.1 Run the test database preflight: the test host is distinct from primary/demo, the `icofr` schema has zero tables, record which of `vector`/`pg_trgm` are still missing, and the role still resolves the default search path. Verify with host-only output, table/extension counts, and `SHOW search_path`; abort if any check fails.
- [x] 4.2 Extend `scripts/db-extensions.mjs` to run `ALTER ROLE CURRENT_USER SET search_path TO icofr, public` after creating the extensions, keeping the command idempotent for primary/demo. Verify on **fresh direct and pooled** connections to the test database that `SHOW search_path` reports `icofr, public` (recycle a stale pooler backend if needed), and confirm the primary/demo settings are unchanged.
- [x] 4.3 Load `TEST_DATABASE_URL` into `DATABASE_URL` for the DDL commands only without echoing it, strip `-pooler` for the direct connection, print the resolved host, and abort unless it matches the test endpoint. Then run `npm run db:extensions`, `npx drizzle-kit push --force`, and `npm run db:check`. If the fresh database carries empty application leftovers in `public` (for example `documents`/`document_embeddings`), confirm all are empty before dropping them. Verify the test database now has 50 application tables in `icofr` (matching primary/demo), both extensions, no application table in `public`, and clear `DATABASE_URL` afterwards.
- [x] 4.4 Run the identity clone dry run, then `--target-env TEST_DATABASE_URL --apply`. Verify the run reports the primary as source, the test host as target, matching identity counts and credential hashes, empty content tables, and exits zero.
- [x] 4.5 Re-open fresh direct and pooled test connections after the clone and confirm `search_path`, application table count, identity counts, and empty content counts still hold; document the before/after numbers in the PR.

## 5. Cloudflare resources and readiness smoke tests

- [x] 5.1 Create the R2 bucket `icofr-documents-test` in the same jurisdiction as the demo bucket, and verify it appears in `npx wrangler r2 bucket list` alongside the primary and demo buckets.
- [x] 5.2 Deploy once with `npm run deploy:test`, then verify the deployment list shows `icofr-test`, `GET /` returns 200, and `GET /api/health` returns `status: healthy`.
- [x] 5.3 Set the test Worker secrets: `BETTER_AUTH_SECRET` generated from 32 random bytes and never copied from demo/primary (record only a truncated fingerprint), `DATABASE_URL` using the pooled test URL, and the shared `GEMINI_API_KEY`. Verify `npx wrangler secret list --name icofr-test` shows exactly those three names, no values, and no stray `TRUSTED_ORIGINS`.
- [x] 5.4 Smoke-test origin isolation: the test host loads with its own origin, the test instance with the primary or demo `Origin` header returns 403 `INVALID_ORIGIN`, and an unauthenticated API request returns the expected 401. Verify with `curl.exe -4 -i` and record status codes only.
- [x] 5.5 Sign in with a cloned credential account that does not depend on an external identity provider or 2FA (use a known password) and confirm the dashboard renders without a license gate. Verify the content lists are empty and the session belongs to the test host.
- [x] 5.6 Create one record in a data module, reload, and confirm it persists; upload one small document, confirm it is listed and downloadable; then delete both. Verify the test database and bucket return to the pre-test state, with only expected operational rows (session/audit) remaining.
- [x] 5.7 Confirm isolation while the test record and document exist: neither the primary nor the demo instance shows them. Verify through their UIs or a read-only list call; record the observation.

## 6. Auto-deploy and final gates

- [ ] 6.1 Configure the Cloudflare Workers Build project for `icofr-test` with the same Git connection as demo, repository root, production branch `main`, build `npm run build`, environment `WRANGLER_CONFIG=wrangler.test.jsonc`, deploy `npx wrangler deploy -c dist/icofr_test/wrangler.json`, and previews disabled. Verify by recording the dashboard settings and running the same commands manually with success.
- [ ] 6.2 Push the implementation to `main` and verify all three instances (primary, demo, test) advance their deployment timestamps to the same commit. Record the timestamps as the auto-deploy proof.
- [x] 6.3 Run the full gates: `npm run type-check`, `npm run lint`, `npm run build`, and `npm test`, redirecting heavy output to a file per `docs/agents/heavy-cli.md`. Verify all exit zero and read back the summaries.
- [x] 6.4 Run `npm run check:loc -- <touched files>`, `npm run check:any-delta -- <touched files>`, and `npm run check:i18n -- <touched files>`; verify every gate passes and attach before/after non-empty LOC counts for each touched source file.
- [x] 6.5 Run the final readiness checklist and record evidence: `/` and `/api/health` 200, cloned login, dashboard without license gate, create/upload/delete cycle, empty content afterwards, origin isolation, and deployment contract plus clone tests green. Confirm no manual database step remains for the next operator.

## Workflow follow-up

- Archive the predecessor change `add-tenant-b-worker-deployment` before or in the same session as this change, so the `tenant-deployment` main spec receives its base requirements first.
- Archive this change only after auto-deploy is proven and the final readiness checklist passes.
