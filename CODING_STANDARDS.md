# Coding Standards (review-time)

Read during review, not implementation. Every rule below is a judgement call
no linter enforces. Mechanical patterns (banned syntax, import shapes,
constant-outcome booleans) belong in `eslint.config.js` as
`no-restricted-syntax` selectors instead — never here.

## Seam codes are produced once, asserted on both sides
When a reason or error code crosses a module seam (worker ↔ client, route ↔
service, module ↔ test), exactly one module produces the literal and every
side that reads it asserts that literal in its own tests. A test that
recomputes the expected code the way the implementation does is tautological
and can never disagree with it; expected codes come from the spec or ticket
as known-good literals.

Why: the suggest seam shipped `NODE_LABEL_TOO_GENERIC` on the worker while
the shared gate and the client spoke `GENERIC_LABEL`, and three
pilar-normalization variants coexisted — all invisible to type-check and
lint because each side compiled in isolation.

Check: for every code crossing a seam in the diff, point at the single
producer module and at one test per consuming side asserting the literal.
Precedents: `SuggestGateReason`, `TestingDecisionCode`, `DeficiencySource`.

## Normalizers and cache keys are single-sourced like codes
When two sides must agree on normalized input or a derived key (trimming,
alias mapping such as `glCode→noGL`, `controlId||id` canonicalization, hash
inputs), exactly one module owns the function and every side imports it. A
second local `trim`/`textOf`/`asTrimmedString` or a second key serialization
(`JSON.stringify` vs `hashStable`) is the same bug class as a duplicated
literal: both sides compile, both tests pass in isolation, production drifts.

Why: `textOf` ×3 plus `asTrimmedString`, popover `JSON.stringify` vs route
`hashStable`, and Row/Card `controlId||id` dedupe each drifted silently until
the 2026-10-17 deepening collapsed them behind `trimText`,
`buildSuggestContextHash`, and `dedupeMatrixControls`.

Check: for every normalization/key in the diff, point at the single owner
module (`shared/ai-cache.ts`, `csa-record-detail.ts`) and at one test per
consuming side asserting identical output on aliased input.
Precedents: `normalizeSuggestContext`, `suggestNormalizedString`,
`dedupeMatrixControls`.

## View scope predicates are single-sourced like normalizers

When two views need different rows from the same collection, the difference is
an explicit, documented option on the ONE predicate — never a forked copy. The
fork drifts silently the moment one side gains a guard the other lacks.

Why: the worksheet control scope existed three times (`BPMWorksheet`,
`BPMModal`, `CSAModal`); `CSAModal` had lost the fiscal-year guard and the FSLI
restriction, so wrong-year controls reached CSA while every gate stayed green.

Check: for a scope filter in the diff, point at the single predicate module and
at the explicit option that encodes the intended view difference. Precedent:
`filterWorksheetControls` (`shared/worksheet-control-scope.ts`,
`allowOrphanFallback`).

## Data-carried i18n keys ride on a literal union and are asserted in the bundle

A key held as data (`{ labelKey }` option lists, config arrays) is invisible to
`check:i18n`, and `strictT(key, { defaultValue })` short-circuits validation —
so a key naming a namespace that does not exist renders its fallback forever,
in every language.

Why: `shared/role-options.ts` referenced `admin:users.roles.*` before any
`admin` bundle existed, and the guard test could never go red because it passed
a `defaultValue`.

Check: the key type is a literal union (a typo is a `tsc` error) and one test
calls `validateI18nKey` on every data-carried key WITHOUT a `defaultValue`.
Precedent: `UserLabelKey`, `user-options.test.ts`.

## Twin view modules share one orchestration seam
When desktop table-row and mobile card render the same record (dual-render
`hidden md:block` + `block md:hidden`), neither holds fetch, dedupe,
dual-save, export, or workflow write-back logic. One pure module plus one
hook owns orchestration; both views are thin adapters that call it.

Why: `CSARecordRow` omitted `bpmProcessId` while `CSARecordCard` passed it,
Row used `setQueryData` while Card direct-mutated `record`, and both inlined
a 30-line `Promise.all` dual-save — three drifts no gate caught.

Check: for every twin edit, point at the shared seam
(`csa-record-detail.ts` + `useCsaRecordDetail.ts`) and at one test locking
the pure helpers; views assert only wiring. Second caller or dedicated test
satisfies YAGNI.
Precedent: `dedupeMatrixControls`, `buildRcmPayload`/`buildTodPayload`,
`resolveWorkflowStatus`, `saveDual`.

## Year-scoped query keys invalidate with the year
When a route is year-scoped (`/api/csa?year=`, `/api/csa/worklist?year=`),
the fetch key includes `workingYear` and every invalidation of that data
carries the same year tuple. A bare `['csa-worklist']` busts all years;
a missing worklist invalidation on delete leaves the Belum-Dinilai tab stale;
an unfiltered `['csa-records-all']` defeats the backend `LIKE 'year%'` filter.

Why: `CSAWorklistTab` bust-all-years, `deleteMutation` missing worklist, and
`CSAPage` unfiltered `csa-records-all` shipped together and stayed green in
jsdom.

Check: for every touched `useQuery`/`invalidateQueries` pair, point at the
fetch key and at each writer proving the key (with year) is invalidated.
Precedents: `csaWorklistKey(workingYear)`, `csaRecordDetailKey`,
`csaMatrixKey`.

## Write mutations surface failures

Every `useMutation` that performs a write must carry an `onError` handler
surfacing the server error to the user (toast). Silent failures lose user
data — the missing-PUT post-mortem was only visible in the console.
Enforcement is split: `local/mutation-requires-onerror` (warn-first in
`eslint.config.js`; run plain `npx eslint` to see the baseline) flags the
pattern mechanically, and the reviewer requires `onError` on every touched
call site. Legacy sites burn down boy-scout on touch; escalate the rule to
`error` once the baseline hits zero.

## Worker code reachable from `src/test` is type-checked WITHOUT strictNullChecks

`src/test/*.test.ts` may import `worker/**` (the integration-test exception), so
`tsconfig.app.json` (`"strict": false`) type-checks the whole `worker/app` route
chain a second time — under settings that change narrowing semantics. There,
boolean literals collapse to `boolean`: a `{ ok: true } | { ok: false; … }` union
does NOT narrow under `!plan.ok`, even though `tsconfig.worker.json` (strict)
accepts exactly the same file. String discriminants, `'code' in plan`, and
`plan.ok === false` all still narrow.

Why: the round-7 rollover seam compiled clean in the worker project and failed
only in the app project, as three `TS2339` errors on the failure fields — a late
and confusing gate for a pattern that reads as correct.

Check: in worker code reachable from `src/test`, a bare negation on a boolean
discriminant is a smell — use an explicit comparison or a string discriminant.
Precedents: `worker/routes/migration/rollover.ts`, `workflow-execution.ts`
(`decision.ok === false`).

## Handling a new Knip finding (`npm run knip`)

Warn-first: a finding never fails CI by itself. For each new finding, do
exactly one of: delete the dead file/export/dependency (verify the full
suite after), or register it in `knip.jsonc` (`ignore`/`ignoreDependencies`)
with a `// reason:` comment naming why it is intentionally kept (vendor
stock, applied migration history, ops runbook, live-lib pairing). Never
add a reason-free entry, and escalate a warning-free type to `"error"` in
`knip.jsonc` rules once it stays clean — that is how the baseline burns
down to a failing gate. Knip does not track `manualChunks` entries in
`vite.config.ts`: after removing a dependency, the build must still pass —
a stale chunk entry breaks Rollup resolution (caught live with `uuid`).

## Dynamic i18n keys ride on literal unions, not free strings

`check:i18n` skips template-literal `t()` keys, so a typo in
``t(`bpm:ipo.tooltip.${key}.label`)`` is invisible to every gate. Dynamic
segments must come from an `as const` union (e.g. `tip: 'c' | 'a' | 'v' |
'ra'`) so `tsc` rejects unknown segments, and the reviewer spot-checks one
rendered key per union against the `en` bundle. Precedent:
`RCMComplianceTab.tsx` (`IPO_ITEMS` / `ASSERTION_ITEMS`).

## Hardcoded copy outside the toast gate is a reviewer call

`check:i18n` sees hardcoded `toast.*("…")` literals and unresolved `t()` keys —
nothing else. Copy typed straight into JSX text, or into `header:` /
`placeholder:` / `title:` / `aria-label:` literals, passes every gate. A
detector over those positions was measured and rejected: 804 hits across 138 of
308 `.tsx` files, most of them legitimate (enum values rendered raw, dates,
format tokens), so it would fail the next honest change and train people to
ignore the gate. This rule is what replaces it.

Why: the round-11 worksheet kept `header: 'Dokumen Pendukung'`,
`placeholder="Isi Proses..."` and nine more while `check:i18n` reported a clean
pass (it counts toasts: 6 → 6), so the mandate's "no hardcoded text" half looked
enforced and was not.

Check: scan the diff for user-visible strings in JSX text position and in
`header` / `placeholder` / `title` / `aria-label` attributes or config keys
across `src/**/*.tsx`; each must be a `t()` key present in `en` and `id`. Add
new keys to both bundles in the same change. Exempt: format exemplars
(`BPM-001`), single-letter data codes (`Y`/`T`), and values that belong to the
data (an application's own name). Precedent: `BPMWorksheetColumns.tsx`
(`worksheet.columns.*`, `worksheet.placeholders.*`, `worksheet.options.*`,
`worksheet.elc.*`), locked by `BPMWorksheetColumns.test.ts`, where every string
header must match `/^worksheet\./`.

## Verification scripts read both sides and fail closed

A script that claims two things are identical — identity clone, tenant sync,
mirror, restore check — must obtain each compared value from its own source. A
comparison that joins the target to itself proves only self-consistency: it
passes on an empty database and on a completely wrong copy. "Nothing to compare"
is a failure, not a pass.

Why: the first identity-clone verifier joined `account` to `account` on the
target, so the hash check compared zero rows and still reported "identical"; the
hand-picked content list then missed tables added after it was written, while
the source database was never read.

Check: for every comparison in the diff, point at (a) the query against the
source, (b) the query against the target, (c) the branch that fails when the
comparable count is zero or below the expected count, and (d) the test locking
the verdict. Emptiness claims enumerate the live catalog
(`pg_tables`/`information_schema`); excluded runtime tables are named and
justified in code. `--apply` refuses when source and target resolve to the same
database. Precedents: `scripts/lib/clone-identity.ts`,
`scripts/__tests__/clone-identity.test.ts`.

## Tenant scoping on mutations and maintenance routes

Any mutating SQL query or ORM execution in `worker/routes/` that modifies,
purges, or inspects tenant-owned business data must be scoped explicitly to the
caller's active `organizationId` (`c.get('organizationId')`). Maintenance or dev
tooling (e.g. `/dev/purge-all`) that issues mass deletions without a tenant filter
is an immediate multi-tenant vulnerability.

Check: for every mutating operation (`update`, `delete`, `DELETE FROM ...`) in the
diff, verify that either (a) an explicit `WHERE organization_id = ${orgId}` predicate
is attached, or (b) the target record's tenant ownership was verified beforehand
in the same transaction.
Precedents: `worker/routes/users/dev.ts` (`/dev/purge-all`), `worker/routes/users/admin.ts`.

