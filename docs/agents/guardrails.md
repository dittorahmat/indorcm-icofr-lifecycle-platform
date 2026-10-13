# Repo guardrails: gates beyond type-check/lint/test

Three gate families live outside `tsc`/`eslint`/`vitest`. All are plain-node
scripts (no deps) plus route-lock tests. Run them before pushing; CI
(`verify.yml`, step "Repo gates") re-runs the deterministic subset on PRs.

## Delta gates (touched files vs a base)

| Gate | Command | Rule |
| --- | --- | --- |
| LOC | `npm run check:loc -- <files...>` | Touched `src`/`worker` file `>400` non-empty lines fails — except grandfathered files that strictly shrink vs HEAD (bug-fix paydown). `--all` scans the repo (fails on `>600`). Local-only: deeper grandfather judgement stays human. |
| any | `npm run check:any-delta -- [--base <ref>] <files...>` | More `any`/`as any`/`as never`/`as unknown as X` than base fails. Base defaults to `HEAD`; CI passes `--base origin/<base-ref>`. |
| i18n | `npm run check:i18n -- [--base <ref>] <files...>` | More hardcoded first-arg `toast.*("…")` literals than base fails. Dynamic args (`err.message`, `t('key')`) never match. Test files excluded (literals are assertions there). Narrow by design: covers the observed silent-English failure mode, not all UI strings — the reviewer enforces the rest. |

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
