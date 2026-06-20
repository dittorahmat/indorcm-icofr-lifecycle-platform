## Context

The system parses and persists `fsliBalance` for GL rows. In the scoping worksheet, rows are grouped by FSLI. Currently, `GLDataGrid.tsx` aggregates the balance of a group by summing individual GL balances. If all GL balances under an FSLI are 0 but a pre-calculated FSLI balance exists, the grid displays a total of 0 and marks the FSLI as out of scope, which is incorrect.

## Goals / Non-Goals

**Goals:**
- Display `fsliBalance` in the grouped FSLI row when it is non-zero, instead of the sum of GL balances.
- Ensure FSLI group-level significance (`quantFlag`) and scoping (`finalStatus`) in the UI reflect `fsliBalance` relative to PM.
- Ensure the exported Excel file uses the correct FSLI balance for grouped rows.

**Non-Goals:**
- Changing database schema or backend parser logic (which already handles `fsliBalance`).

## Decisions

### 1. Grouped Balance Calculation in GLDataGrid
**Decision:** Modify the balance column cell renderer and Excel exporter in `GLDataGrid.tsx` to check for a non-zero `fsliBalance` from the group's leaf rows.
- **Details:** If `leafRows[0]?.original.fsliBalance` is non-zero, use it as the group total. Otherwise, sum the individual row balances.

### 2. Significance and Scope Aggregation in GLDataGrid
**Decision:** Refactor the `quantFlag` and `finalStatus` column `aggregationFn` handlers in `GLDataGrid.tsx`.
- **Details:**
  - For `quantFlag`, if `fsliBalance` is present and non-zero, check `Math.abs(fsliBalance) >= pmValue`. Otherwise, check if `any(leafRow.balance >= pmValue)`.
  - For `finalStatus`, evaluate `isQualSignificant || isKuanSignificant` where `isKuanSignificant` uses `fsliBalance` if present.

## Risks / Trade-offs

- **[Risk] Multiple different FSLI balances in the same group** → Source files might theoretically have different `FSLI_Balance` values on rows under the same FSLI.
  - **Mitigation:** We pick the first non-zero `fsliBalance` from the leaf rows (`leafRows[0]`), which corresponds to the FSLI-level total provided in the Excel sheet.
