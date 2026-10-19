# Repo guardrails: gates beyond type-check/lint/test

Three gate families live outside `tsc`/`eslint`/`vitest`. All are plain-node
scripts (no deps) plus route-lock tests. Run them before pushing; CI
(`verify.yml`, step "Repo gates") re-runs the deterministic subset on PRs.

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
| any | `npm run check:any-delta -- [--base <ref>] <files...>` | More `any`/`as any`/`as never`/`as unknown as X` than base fails. Base defaults to the branch point; CI passes `--base origin/<base-ref>`. |
| i18n | `npm run check:i18n -- [--base <ref>] <files...>` | (a) More hardcoded first-arg `toast.*("…")` literals than base fails. Dynamic args (`err.message`, `t('key')`) never match. (b) Any NEW static `t('key')` missing from the `en` locale bundle fails (delta vs base; pre-existing misses grandfathered). Dynamic keys skipped; missing-in-`id`-but-present-in-`en` allowed (English fallback). Test files excluded. Dev logs missing keys via `missingKey` in `src/i18n/config.ts`. Scope note: this gate does NOT see hardcoded copy in JSX text or `header:`/`placeholder:`/`title:` literals — a detector over those fires ~800 times across ~140 existing files (enum values, dates, tokens), so it would fail the next honest change. That half of the mandate is a reviewer rule in `CODING_STANDARDS.md`. |
| worker prose | `npm run check:worker-strings -- [--base <ref>] <files...>` | More user-facing prose in a worker **code** slot than base fails — `bad(c, 'Kontrol tidak ditemukan')`, `notFound(c, '…')`, or `throw new Error('…')`. The code belongs on a literal union; prose belongs in the message arg (`AppError(code, message, status)`). Scope `worker/**/*.ts`, test files excluded. Baseline 81 findings (grandfathered by the delta; burn down on touch). Whole-tree inventory: `npm run check:worker-strings` (report mode, exits 0). |
| route guards | `npm run check:rbac-delta -- [--base <ref>] <files...>` | A touched `worker/routes/**/*.ts` file that declares MORE mutating route registrations (POST/PUT/PATCH/DELETE) without a guard (`rbac(...)` / `assertDevAllowed(...)`) than its base fails. Files outside `worker/routes/**` print `SKIP`. Detection is **not** re-implemented: the gate runs the real `local/routes-require-rbac` rule (`eslint-local/index.js`) in memory over both the working-tree text and the base blob, so the gate and `npm run lint` can never disagree about what an unguarded route is. The rule stays `warn` (baseline 61 → 44 after the first #97 pass, 2026-10-19) so the remainder burns down per area; this gate is the tooth. |

## Contract gates (whole tree)

| Gate | Command | Rule |
| --- | --- | --- |
| Route URLs | `worker/routes/__tests__/<domain>.test.ts` (vitest) | Every barrel asserts its URLs byte-identical. A renamed route fails here instead of 404ing silently on the client. Add URLs to the list when a barrel gains a route; never loosen the list to make it pass. |
| Frontend→backend | `npm run check:api-contract` | Every frontend `(method, path)` from `api()`/`fetch()` must match a backend Hono route (method-aware: a path served only for GET fails when called with PUT). Triaged gaps live in the script's `ALLOWLIST` — never reason-free. Correlated `cond ? A : B` url/method ternaries pair branch-wise. Skipped by design: the `api()` wrapper itself, `/api/auth/*` (Better Auth), absolute URLs. |

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
not fail the build. Baseline **61** at introduction (2026-10-18) → **44** after
the first burn-down pass (2026-10-19, issue #97: `remediation` 5,
`infrastructure` 9, `transactions` 3). Each pass is a **policy** decision — which
roles may write an area — not a mechanical one: the client side of those routes
carries no role gate at all, so the evidence is the repo's own precedent
(`['Line 1','Admin']` for operational data, `['Line 2','Admin']` for testing/
evaluation, `['Admin']` for config). `check:rbac-delta` (table above) is what
keeps a touched file from adding a new unguarded route while the rest burns down.
Each guarded barrel pins its own coverage: the route test asserts that oversight
roles (`External Auditor`, `Line 3`) get **403** on every mutating route it
declares — removing an `rbac(...)` makes the handler run and answer 500, so the
assertion fails instead of passing vacuously.

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
stay in CI). It is installed automatically: `package.json` `"prepare"` runs
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

## Page tests use the shared query mock

`src/test/mock-page-queries.ts` (`definePageQueryMock` /
`resetPageQueryStore`) is the single mock shape for page tests that need
per-key `useQuery` data. New/edited page tests must pair it with one
`vi.hoisted` store per file — never a fresh per-test
`vi.mocked(useQuery).mockImplementation(({ queryKey }: any) …)` (the `any`
plumbing trips `check:any-delta`; CSA hub post-mortem). Legacy per-test
plumbing burns down boy-scout on touch.
