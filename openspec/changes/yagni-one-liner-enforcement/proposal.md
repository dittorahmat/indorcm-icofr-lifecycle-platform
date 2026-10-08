## Problem Statement

As a contributor to IndoGRC Pro, I face silent accumulation of hypothetical abstractions — single-use hooks, wrappers, utils, config options, and unused props — that increase maintenance cost and violate the YAGNI mandate, because the existing rule is advisory with no blocking enforcement.

## Solution

As a contributor, I get a blocking enforcement process for YAGNI-Violation and One-Liner preference: every new abstraction must prove a second consumer or a dedicated locking test, otherwise it stays inline; business computation keeps its tested pure module; historic code is grandfathered with net LOC never increasing.

## User Stories

1. As a frontend contributor, I want a clear definition of YAGNI-Violation, so that I know what will be rejected in review.
2. As a frontend contributor, I want a clear definition of One-Liner, so that I default to inline expression without guessing.
3. As a frontend contributor, I want a clear definition of Abstraksi Sekali-Pakai, so that I know when extraction is forbidden.
4. As a contributor, I want the PR checklist to ask one question for every new file/function/hook/type, so that I justify extraction before review starts.
5. As a contributor, I want extraction allowed when there are two or more consumers, so that genuine reuse is not blocked.
6. As a contributor, I want extraction allowed when a dedicated test locks the behavior, so that test-worthy logic stays testable.
7. As a contributor, I want extraction allowed when splitting a god-file over the soft limit, so that decomposition is not punished.
8. As a contributor, I want business computation to stay in a tested pure module even when single-use, so that materiality and aggregation logic never goes untested.
9. As a contributor, I want glue UI to stay inline, so that render guards and light formatting do not spawn files.
10. As a reviewer, I want a locked list of five forbidden patterns, so that I reject consistently without debate.
11. As a reviewer, I want the existing lint gate to catch unused props and variables, so that dead surface is blocked automatically.
12. As a reviewer, I want the existing LOC gate to block soft-limit growth on touched files, so that god-files cannot grow through new abstractions.
13. As a maintainer, I want historic violations grandfathered, so that the repository does not fail on day one.
14. As a maintainer, I want net LOC to never increase on grandfathered cleanup, so that boy-scout work only shrinks the codebase.
15. As a maintainer, I want one-off scripts banned from the repository root, so that clutter stays in the designated scripts area.
16. As a compliance auditor, I want the glossary to define the three canonical terms, so that audits use shared language.
17. As a compliance auditor, I want the enforcement decision recorded as an ADR, so that future readers understand the trade-off.

## Implementation Decisions

- Modules built or modified: the LOC gate (reporting plus soft/hard limits), the lint pipeline (unused detection), the PR review process (single justification question), the domain glossary (three canonical terms), the ADR store (enforcement record).
- Interfaces modified: the contributor workflow (new abstraction requires second-consumer-or-test answer), the reviewer workflow (five-pattern checklist), the grandfather policy (delta-only blocking with non-increasing LOC).
- Technical clarifications from grill: enforcement is process-based, not a new single-use AST detector; that detector was explicitly rejected as its own YAGNI violation with high false-positive risk.
- Architectural decisions: single highest seam reused (existing gates), no new service, no new abstraction layer; exception for test-worthy business logic wins over inline preference.
- Schema changes: none.
- API contracts: none; no endpoint or data-shape change.
- Specific interactions: contributor answers justification at PR time; reviewer checks five patterns; maintainer verifies LOC gate output shows no growth; auditor reads glossary plus ADR.

## Testing Decisions

- What makes a good test: only external behavior is tested (gate passes or fails, checklist answered, glossary term resolvable), never implementation details of any detector.
- Which modules will be tested: the LOC gate outcome on touched scope, the lint outcome on unused surface, the presence and resolvability of the three glossary terms and the enforcement ADR.
- Prior art: existing pure-logic unit tests for business computation, plus existing runs of the LOC gate and lint pipeline as regression anchors.

## Out of Scope

- Automatic single-use AST detection or new custom lint rules.
- Mass automatic refactoring of all historic violations.
- New file-scaffolding generators, generic hook libraries, or shared-wrapper frameworks.
- Database schema changes, API changes, UI redesign, or localization work.
- Real-time collaboration, offline support, or advanced i18n features.

## Further Notes

Uses domain vocabulary throughout: YAGNI-Violation, One-Liner, Abstraksi Sekali-Pakai. Respects the enforcement ADR and the prior ingestion/linkage ADR. Grandfather constraint from grill: cleanup may shrink historic debt when possible, but must never grow it. Tension between inline preference and pure-logic extraction is resolved: test-worthy business logic always stays extracted and tested.
