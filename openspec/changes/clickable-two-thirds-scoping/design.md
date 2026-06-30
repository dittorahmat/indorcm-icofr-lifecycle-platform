## Context

The ICOFR Lifecycle Platform uses a General Ledger data grid (`GLDataGrid.tsx`) to show all accounts from General Ledger snapshots. The grid calculates in-scope accounts dynamically. A previous change (`implement-two-thirds-scoping-rule`) introduced a new `scopeClassification` on each row to indicate whether it is in-scope due to being above PM, qualitative high-risk factors, or to satisfy the 2/3 (Condition A/B) regulatory compliance. However, the interactivity logic (which makes accounts clickable and reveals application selectors) was left unchanged and evaluates only the legacy `balance >= pmValue` or `isQualSignificant` checks. This results in the `two-thirds` classified accounts being non-interactive in the UI.

## Goals / Non-Goals

**Goals:**
- Make all accounts classified as in-scope (including `two-thirds` compliance accounts) interactive, clickable, and mapping-enabled in `GLDataGrid.tsx`.
- Refactor the grid's scope detection logic to directly leverage the `row.original.scopeClassification` property.

**Non-Goals:**
- Modifying how the 2/3 coverage calculation or classification is computed in `getRowScopeClassification` or `useScopingPage`.
- Adding new database tables or API endpoints.

## Decisions

- **Decision 1: Leverage `scopeClassification` in `GLDataGrid.tsx` cells**
  - **Rationale**: Since the backend/hook already computes `scopeClassification` for each row, reusing it eliminates redundant calculations and ensures that the grid row visual colors (which use `scopeClassification`) match the interactivity and badge statuses perfectly.
  - **Alternative considered**: Recalculating 2/3 inclusion rules inside the column cell definitions. This was rejected because it introduces code duplication and increases complexity.

- **Decision 2: Define `isInScope` as `classification !== 'out-of-scope'`**
  - **Rationale**: It covers `'above-pm'`, `'two-thirds'`, and `'qualitative'` in a single concise check.

## Risks / Trade-offs

- **[Risk]** → Non-existent classification on grouped rows.
  - **Mitigation** → Check `!row.getIsGrouped()` before accessing `row.original?.scopeClassification`. Grouped rows do not have original entity records and are handled by the React Table grouping cells.
