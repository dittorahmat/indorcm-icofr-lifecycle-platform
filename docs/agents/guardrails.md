# Repo guardrails: gates beyond type-check/lint/test

Three gate families live outside `tsc`/`eslint`/`vitest`. All are plain-node
scripts (no deps) plus route-lock tests. Run them before pushing; CI
(`verify.yml`, step "Repo gates") re-runs the deterministic subset on PRs.

## Delta gates (touched files vs a base)

| Gate | Command | Rule |
| --- | --- | --- |
| LOC | `npm run check:loc -- <files...>` | Touched `src`/`worker` file `>400` non-empty lines fails — except grandfathered files that strictly shrink vs HEAD (bug-fix paydown). `--all` scans the repo (fails on `>600`). Local-only: deeper grandfather judgement stays human. |
| any | `npm run check:any-delta -- [--base <ref>] <files...>` | More `any`/`as any`/`as never`/`as unknown as X` than base fails. Base defaults to `HEAD`; CI passes `--base origin/<base-ref>`. |
| i18n | `npm run check:i18n -- [--base <ref>] <files...>` | (a) More hardcoded first-arg `toast.*("…")` literals than base fails. Dynamic args (`err.message`, `t('key')`) never match. (b) Any NEW static `t('key')` missing from the `en` locale bundle fails (delta vs base; pre-existing misses grandfathered). Dynamic keys skipped; missing-in-`id`-but-present-in-`en` allowed (English fallback). Test files excluded. Dev logs missing keys via `missingKey` in `src/i18n/config.ts`. |

## Contract gates (whole tree)

| Gate | Command | Rule |
| --- | --- | --- |
| Route URLs | `worker/routes/__tests__/<domain>.test.ts` (vitest) | Every barrel asserts its URLs byte-identical. A renamed route fails here instead of 404ing silently on the client. Add URLs to the list when a barrel gains a route; never loosen the list to make it pass. |
| Frontend→backend | `npm run check:api-contract` | Every frontend `(method, path)` from `api()`/`fetch()` must match a backend Hono route (method-aware: a path served only for GET fails when called with PUT). Triaged gaps live in the script's `ALLOWLIST` — never reason-free. Correlated `cond ? A : B` url/method ternaries pair branch-wise. Skipped by design: the `api()` wrapper itself, `/api/auth/*` (Better Auth), absolute URLs. |

## Mutation feedback (warn-first)

`local/mutation-requires-onerror` (`eslint-local/`, wired `warn` in
`eslint.config.js`) flags `useMutation({...})` without `onError`. Reviewer
requires `onError` user feedback on every touched call site
(`CODING_STANDARDS.md`); legacy sites burn down boy-scout on touch. Escalate
the rule to `error` once `npx eslint src` reports zero hits.

## Local pre-commit (fast gates, no new deps)

`.githooks/pre-commit` runs `check:any-delta` + `check:i18n` on staged files
only (seconds; full type-check/lint/test stay in CI). Enable once per clone:

`git config core.hooksPath .githooks`

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
