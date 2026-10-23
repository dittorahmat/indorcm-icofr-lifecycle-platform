# Repo guardrails: gates beyond type-check/lint/test

`tsc` covers four projects (`src`, `worker`, `scripts/**`, `vite.config.ts`) —
every `.ts` file in the repo belongs to one of them. The gate families below add
smell/contract checks on top; all are plain-node scripts (one,
`check:workflows`, needs a YAML parser — see its row) plus route-lock tests. Run
them before pushing; CI (`verify.yml`, step "Repo gates") re-runs the
deterministic subset on PRs.

## Delta gates (touched files vs a base)

Every gate below answers "did this change introduce MORE of a smell than its
base version had". The base is the **branch point**, not `HEAD`:

`--base <ref>` when given (CI passes `origin/<base-ref>`) → else the merge-base
of `HEAD` with `origin/main` (falling back to `main`, `origin/master`,
`master`) → else `HEAD` in a repo with no base branch. Resolution lives in
`scripts/lib/delta-base.mjs`, and every gate prints the resolved base in its
summary line — read it before believing a pass.

Why it is not `HEAD`: "vs `HEAD`" makes the verdict depend on whether you have
committed. Before `git commit` the base is your pre-change file and the gate
sees the real delta; after committing, the change *is* `HEAD` and every delta
collapses to zero. The gate went green exactly when it could no longer see the
work, and `check:loc`'s grandfather rule was unenforceable as written —
committing a paydown made the file its own baseline, so the same tree failed
after the commit that passed before it.

| Gate | Command | Rule |
| --- | --- | --- |
| LOC | `npm run check:loc -- [--base <ref>] <files...>` | Touched `src`/`worker`/`shared` `.ts`/`.tsx` file `>400` non-empty lines fails — except grandfathered files that strictly shrink vs the base (bug-fix paydown). Files outside that scope (locale/data JSON, docs, lockfiles) print `SKIP (out of LOC scope)` and never fail: touched mode applies the same scope as `--all`. `--all` scans the repo (fails on `>600`). Enforced in CI (not in the pre-commit hook — see "Local pre-commit" below); the shrink-only rule is mechanical, so no human judgement is needed. Count method: non-empty lines (`scripts/check-loc.mjs`), never raw `Measure-Object -Line`. |
| any | `npm run check:any-delta -- [--base <ref>] <files...>` | More `any`/`as any`/`as never`/`as unknown as X`/non-null `!` than base fails. Base defaults to the branch point; CI passes `--base origin/<base-ref>`. Test files are exempt from the non-null half (banned syntax is legitimate fixture data). Patterns live in `scripts/lib/any-smell-patterns.mjs` and are unit-tested. |
| i18n | `npm run check:i18n -- [--base <ref>] <files...>` | (a) More hardcoded first-arg `toast.*("…")` literals than base fails. Dynamic args (`err.message`, `t('key')`) never match. (b) Any NEW static `t('key')` missing from the `en` locale bundle fails (delta vs base; pre-existing misses grandfathered). Dynamic keys skipped; missing-in-`id`-but-present-in-`en` allowed (English fallback). Test files excluded. Dev logs missing keys via `missingKey` in `src/i18n/config.ts`. Scope note: this gate does NOT see hardcoded copy in JSX text or `header:`/`placeholder:`/`title:` literals — a detector over those fires ~800 times across ~140 existing files (enum values, dates, tokens), so it would fail the next honest change. That half of the mandate is a reviewer rule in `CODING_STANDARDS.md`. |
| worker prose | `npm run check:worker-strings -- [--base <ref>] <files...>` | More user-facing prose in a worker **code** slot than base fails — `bad(c, 'Kontrol tidak ditemukan')`, `notFound(c, '…')`, or `throw new Error('…')`. The code belongs on a literal union; prose belongs in the message arg (`AppError(code, message, status)`). Scope `worker/**/*.ts`, test files excluded. Baseline 81 findings (grandfathered by the delta; burn down on touch). Whole-tree inventory: `npm run check:worker-strings` (report mode, exits 0). |
| route guards | `npm run check:rbac-delta -- [--base <ref>] <files...>` | A touched `worker/routes/**/*.ts` file that declares MORE mutating route registrations (POST/PUT/PATCH/DELETE) without a guard (`rbac(...)` / `assertDevAllowed(...)`) than its base fails. Files outside `worker/routes/**` print `SKIP`. Detection is **not** re-implemented: the gate runs the real `local/routes-require-rbac` rule (`eslint-local/index.js`) in memory over both the working-tree text and the base blob, so the gate and `npm run lint` can never disagree about what an unguarded route is. The rule stays `warn` (baseline 61 → 44 on 2026-10-19, → 28 on the second pass the same day: nine guards plus seven documented exemptions) so the remainder burns down per area; this gate is the tooth. |

## Contract gates (whole tree)

| Gate | Command | Rule |
| --- | --- | --- |
| Route URLs | `worker/routes/__tests__/<domain>.test.ts` (vitest) | Every barrel asserts its URLs byte-identical. A renamed route fails here instead of 404ing silently on the client. Add URLs to the list when a barrel gains a route; never loosen the list to make it pass. |
| Frontend→backend | `npm run check:api-contract` | Every frontend `(method, path)` from `api()`/`fetch()` must match a backend Hono route (method-aware: a path served only for GET fails when called with PUT). Triaged gaps live in the script's `ALLOWLIST` — never reason-free. Correlated `cond ? A : B` url/method ternaries pair branch-wise. Skipped by design: the `api()` wrapper itself, `/api/auth/*` (Better Auth), absolute URLs. |
| Workflows | `npm run check:workflows` | Every `.github/workflows/*.y{a,}ml` must parse and declare `on:` plus at least one job. Absolute, not delta-shaped: a workflow file is valid or it is not, and an unparseable one fails in the worst way — GitHub refuses the whole file and reports "likely failed because of a workflow file issue" with **0s, zero jobs and no log**, so nothing in this repo turns red and the PR silently stops being verified. Incident 2026-10-19: one under-indented line inside `verify.yml`'s `run: \|` block (commit `57f75cf`) left the gate that verifies everything unverified for four commits (`39200554676`, `39207065068`). Parsed with the `yaml` package rather than a hand-rolled indentation regex, because a guess at what GitHub accepts would fail honest workflows instead. |
| Test i18n mocks | `npm run check:test-i18n` | A test that mocks `react-i18next` must use `strictT`/`validateI18nKey` from `src/test/mock-i18n.ts`. Flagged: identity `t: (key) => key`, `opts?.defaultValue ?? key` fallbacks, and `if (key === '…') return 'English text'` tables — each locks copy the `en` bundle never ships. A mock that resolves keys against the real locale objects is allowed (it already reads the bundle). |
| Dead doc references | `npm run check:doc-refs` | Every repo-root-relative path with a file extension written in a comment under `src/` or `worker/` must exist. `src/utils/ocr-layout-audit.ts` shipped a header citing `scripts/ocr-pdf-audit.ts`, a file that never existed; type-check, lint and tests all stayed green because a false comment is syntactically fine. Extensionless citations (`worker/app`) are prose/module specifiers and stay out of scope. |
| OCR geometry constants | `npm run check:ocr-constants` | `LANE_*`, `ROW_*`, `CONTENT_TOP`, `MIN_NODE_CLEARANCE`, `contentLaneHeight`, `boxesOverlap` may be declared only in `src/utils/ocr-layout-rows.ts` / `ocr-layout-deoverlap.ts`; consumers import them. The OCR layout shipped with `LANE_FOOTER = 80` re-declared in the rank engine and the audit re-deriving the lane height by hand — three copies that agreed only by luck. |

## Route splits keep the barrel and the mount line

A domain route split (`worker/routes/<domain>/` + barrel) preserves URLs only
if three things stay byte-identical: every URL/method, the barrel's
`default export` name, and the `worker/app.ts` mount line. `check:api-contract`
has an EMPTY allowlist — there is no waiver path, so a renamed path fails the
gate for real instead of 404ing silently on the client.

Trap: Hono lists a `.route('/', subApp)` child's route TWICE in the mounted
app's `routes` (once for the child, once for the mount). A route-lock test must
assert with `toContain` / a deduped set, never exact-array equality — observed
2026-10-17 during the `migration.ts` split.

## Mutation feedback (warn-first)

`local/mutation-requires-onerror` (`eslint-local/`, wired `warn` in
`eslint.config.js`) flags `useMutation({...})` without `onError`. Reviewer
requires `onError` user feedback on every touched call site
(`CODING_STANDARDS.md`); legacy sites burn down boy-scout on touch. Escalate
the rule to `error` once `npx eslint src` reports zero hits.

`local/routes-require-rbac` (`eslint-local/`, also `warn`) is the same shape for
`worker/routes/**`: a mutating registration without a guard is reported but does
not fail the build. Baseline **61** at introduction (2026-10-18) → **44** (first
burn-down pass, 2026-10-19, issue #97: `remediation` 5, `infrastructure` 9,
`transactions` 3) → **28** (second pass: `notifications`, `users`, `license`,
`rcm`, `bpm`, `account-assertions`, `scoping-simulations`). Each pass is a
**policy** decision — which roles may write an area — not a mechanical one: the
client side of those routes carries no role gate at all, so the evidence is the
repo's own precedent (`['Line 1','Admin']` for operational data,
`['Line 2','Admin']` for testing/evaluation, `['Admin']` for config, and the
domain's own file where it already answers the question — `scoping` is
`['Line 2','Admin']`, not Line 1).

Three route shapes do **not** take a role list, and say so in place:

- **Session-scoped writes** — the handler writes strictly the caller's own row
  (`WHERE userId = c.get('userId')`). A role list here would deny a role its own
  settings and go stale the day a role is added, so the route carries a reason
  instead: `// rbac-exempt: self-scoped — writes the caller's own row`. The rule
  *requires* the reason (an empty directive is still reported) and reports a
  directive left behind on a route that does carry a guard.
- **Workflow endpoints** — `runWorkflowTransition` receives the caller's role and
  decides which action that role may take, so the route guard only has to admit
  the union of roles an action can belong to (the union `remediation` uses).
- **Role checks inside the service** — e.g. `ControlService.delete` decides by
  role; the route guard admits the roles that may attempt it and the service keeps
  the fine-grained rule. A **client-supplied flag is never such a rule**: the
  `?bypassWorkflow=true` query parameter that both `controls` and `simulations`
  accepted let any Line 1 caller delete an Approved record, and no client ever
  sent it — it is gone.

Each guarded barrel pins its own coverage: the route test asserts that oversight
roles (`External Auditor`, `Line 3`) get **403** on every mutating route it
declares — removing an `rbac(...)` makes the handler run and answer 500, so the
assertion fails instead of passing vacuously. The mechanics live in
`worker/routes/__tests__/rbac-coverage.ts` (`mutatingRoutes` / `reachableBy`,
deduped because Hono lists a mounted child's routes twice); a barrel with
session-scoped writes passes its exempt list there, so the exemption is asserted
from both sides — a silent new exemption and a stray guard both fail.

## Gates measured and rejected (do not rebuild these)

Both were proposed as mechanical gates and both were killed by measurement, not
taste. The numbers live here so the next retro does not re-derive them.

- **Hardcoded UI copy detector.** `check:i18n` covers `toast.*` literals and
  unresolved keys only. A detector over JSX text plus `header` / `placeholder` /
  `title` / `aria-label` literals fired **804 times across 138 of 308 `.tsx`
  files**, dominated by enum values rendered raw, dates and format tokens, so a
  delta gate would fail the next honest change and train people to ignore it.
  Replacement: the reviewer rule in `CODING_STANDARDS.md`, plus the header-key
  assertion in `BPMWorksheetColumns.test.ts`.
- **Doc path existence check** (every repo path named in the agent docs must
  exist). The 13 agent-facing docs name 334 path tokens; 76 do not resolve, and
  most are missing *by design*: `docs/agents/arch-hotspots-*.md` are proposal
  reports naming the modules they propose (`src/lib/format-money.ts`,
  `shared/assertion-fields.ts`) and the branches to cut (`arch/deepen-7-review`).
  Restricting the check to the steering docs leaves only directory references
  (`utils/bpm-auto-layout`) that no extractor resolves without a search path, so
  the gate would be either noisy or near-empty. Fix a stale pointer by hand.

## Local pre-commit (fast gates, no new deps)

`.githooks/pre-commit` runs `check:any-delta` + `check:i18n` +
`check:worker-strings` on staged files only (seconds; full type-check/lint/test
stay in CI). It also runs the three cheap whole-tree invariants
(`check:test-i18n`, `check:doc-refs`, `check:ocr-constants`): a dead comment or a
duplicated constant is wrong regardless of which PR introduced it. Workflow
edits additionally run `check:workflows`, and they run it
even when nothing else is staged, because that failure mode is invisible in CI
(startup failure, zero jobs) rather than red. It is installed automatically: `package.json` `"prepare"` runs
`scripts/install-hooks.mjs`, so `npm install` / `npm ci` point
`core.hooksPath` at `.githooks`. Manual fallback if the hook is ever missing:

`git config core.hooksPath .githooks`

An absent hook is invisible — a fresh clone without it looks exactly like a
clean one — which is why the install is wired to the package lifecycle instead
of a README step. The gates read the **working tree** file, not the staged
blob: re-stage after editing or the gate judges different content than the
commit will contain.

`check:loc` is NOT in the hook, though it is delta-shaped: its grandfather rule
can demand a split for a file you only bug-fixed, and a hook that blocks a
legitimate one-line fix teaches `git commit --no-verify` — which would cost the
three gates above their teeth. It runs in CI (`verify.yml`, "Repo gates") where
a failure is a review conversation. Run it yourself before the LOC-sensitive
part of a change is done (`npm run check:loc -- <files...>`).

## Tests use the strict i18n mock

`src/test/mock-i18n.ts` (`strictT` / `validateI18nKey`) resolves `t()` calls
against the real `en` bundles and throws on a missing key — an identity
`(key) => key` mock can never disagree with a wrong key (CSA worklist
post-mortem). New/edited tests must use the helper, never a fresh identity
mock. Custom translated-text assertions keep their tables and add one
`validateI18nKey(key)` line.

The rule is enforced mechanically by `npm run check:test-i18n` (pre-commit and
CI), because it was written down here first and still two hand-rolled mocks
shipped in `fix-bpm-ocr-coordinate-faithful-layout`. The gate flags the three
shapes that hide a bad key (identity, `defaultValue ?? key`, hardcoded table) and
stays quiet for a mock that reads the real bundle.

## OCR layout: capture once, replay offline

Verifying a layout change must not require a model call. `npm run ocr:probe --
<file.pdf|png> [--out fixtures/ocr/<slug>.ocr.json]` renders page 1, calls the
OCR seam once, writes the parsed response, and prints the geometry audit
verdict. `src/test/ocr-real-snapshot.test.ts` replays those captures in
`npm test`, so the gate is offline and free; the probe is only for producing a
new capture or refreshing one.

The live vitest probe (`OCR_LIVE=1 npx vitest run src/test/ocr-pdf-e2e.test.ts`)
stays opt-in and exists to answer "does the model still extract a drawing from
this PDF", not "is the layout right" — the provider can be unavailable (503
high-demand) and slow (10-240 s), and neither says anything about our code.

Geometry constants are single-source (`check:ocr-constants`); the rationale and
the module map live in `src/components/rcm/editor/README.md`.

## Page tests use the shared query mock

`src/test/mock-page-queries.ts` (`definePageQueryMock` /
`resetPageQueryStore`) is the single mock shape for page tests that need
per-key `useQuery` data. New/edited page tests must pair it with one
`vi.hoisted` store per file — never a fresh per-test
`vi.mocked(useQuery).mockImplementation(({ queryKey }: any) …)` (the `any`
plumbing trips `check:any-delta`; CSA hub post-mortem). Legacy per-test
plumbing burns down boy-scout on touch.

## Deployment & cross-boundary verification

Rules for instance/deployment work and for any script that claims two things
match. Runbook: `docs/DEPLOYMENT-MULTI-INSTANCE.md`; schema-sync exception:
`docs/adr/0009-schema-sync-push-and-fresh-db-bootstrap.md`.

- **One target, one explicit artifact.** A new instance gets its own Wrangler
  config plus a build/deploy script that names the generated artifact
  (`dist/<worker>/wrangler.json`). Never rely on `.wrangler/deploy/config.json`
  for a manual/CI deploy: it points at the last build, so a stale redirect can
  overwrite the other Worker. The shared-key, name, bucket, `ENV`,
  `BETTER_AUTH_URL`, no-secrets, and artifact-path invariants are locked by
  `scripts/__tests__/deployment-config.test.ts`, which derives its table from
  every `wrangler*.jsonc` and fails on an uncovered config. Adding an instance
  means adding its config, scripts, and table row — not another copy of the
  assertions.
- **Provisioning names its target.** The identity clone takes
  `--target-env <NAME>` (no default), prints source/target hosts without
  credentials, and refuses a non-empty target before writing. Every database
  bootstrap must also pin the role's `search_path` to `icofr, public`
  (`scripts/db-extensions.mjs`); the Worker opens connections without one, so a
  fresh Neon database otherwise resolves `public` and fails every query.
- **Verification reads both sides and fails closed.** A clone/sync/mirror script
  compares each value from its own database/file — never the target joined to
  itself — and treats "no comparable rows" as failure, not success. No
  `?? true` / `?? 0` fallback that passes on empty input.
- **"Empty" enumerates the live catalog.** Query `pg_tables` /
  `information_schema` instead of a hand-picked table list so a new content
  table is covered automatically. Excluded runtime tables (`session`,
  `verification`, `notifications`, `audit_logs`, `ai_cache_entries`,
  `system_licenses`) are named, justified in code, and tested.
- **`scripts/**` is product code.** `npm run type-check` covers app, worker,
  `scripts/**` (`tsconfig.scripts.json`), and `vite.config.ts`
  (`tsconfig.node.json`); a new `.ts` file must fall inside one of those
  projects. Decision logic lives in pure modules with tests
  (`scripts/lib/clone-identity.ts`), `--apply` refuses when source and target
  resolve to the same database, and `check:any-delta` now counts non-null
  assertions as well as `any`/escape-casts (test files are exempt from the
  non-null half because banned syntax is legitimate fixture data).
- **Integritas multi-instance & zero drift normalizer.** Helper URL/database host wajib
  bersumber tunggal via `scripts/lib/db-url.mjs` (`toDirectUrl`, `databaseHost`).
  Dilarang duplikasi inline `new URL(...).host` fallback di script baru.
  Target clone wajib ditentukan secara eksplisit via `--target-env <NAME>` tanpa default.
- **Bootstrap schema & public exclusion invariant.** Setiap bootstrap database instance baru
  wajib mengunci `search_path TO icofr, public` dan memastikan tidak ada tabel aplikasi yang tertinggal
  di skema `public`. Invariant ini dikunci otomatis secara runtime oleh `npm run db:check` dan unit test
  pendamping `evaluatePublicSchemaTables` (`scripts/__tests__/clone-identity.test.ts`).
- **Locking tests untuk syarat deployment/spec.** Setiap requirement provisioning, DDL, atau deployment
  baru pada proposal/spec wajib disertai unit test pengunci otomatis (pure verdict logic / table contract /
  coverage scan) sebelum implementasi dianggap selesai.
- **Secrets vs vars.** Deployment docs must not claim a value is a `vars` entry
  without showing it in the config; dashboard-only secrets are written as
  "secret Worker (dashboard)".
- **Bootstrap and the audit trail.** A one-shot provisioning script may skip
  `audit_logs`, but it states that in its header and in the runbook.
- **Session origin isolation.** `BETTER_AUTH_URL` is the only trusted auth
  origin for an instance (`worker/lib/trusted-origins.ts`); never add another
  instance's origin to that list. Extra custom domains go through
  `TRUSTED_ORIGINS`.
- **Verifying a deploy without the dashboard.**
  `npx wrangler deployments list --name <worker>`,
  `npx wrangler secret list --name <worker>`, `npx wrangler r2 bucket list`.
  Workers Builds settings (connect-to-git, build command/env, previews) have no
  CLI: a human confirms them in the dashboard, and the next push to `main` is
  the only proof auto-deploy is live.
