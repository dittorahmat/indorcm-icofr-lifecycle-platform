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

## Write mutations surface failures

Every `useMutation` that performs a write must carry an `onError` handler
surfacing the server error to the user (toast). Silent failures lose user
data — the missing-PUT post-mortem was only visible in the console.
Enforcement is split: `local/mutation-requires-onerror` (warn-first in
`eslint.config.js`; run plain `npx eslint` to see the baseline) flags the
pattern mechanically, and the reviewer requires `onError` on every touched
call site. Legacy sites burn down boy-scout on touch; escalate the rule to
`error` once the baseline hits zero.

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
