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
