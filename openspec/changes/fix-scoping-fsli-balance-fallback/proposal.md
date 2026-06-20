## Why

When FSLIs (Financial Statement Line Items) have multiple GL accounts with zero balances, but the parent FSLI has a non-zero pre-calculated balance (`FSLI_Balance` or `fsliBalance`), the scoping editor grid and calculations display zero balances and evaluate incorrect quantitative significance. This prevents accurate scoping assessments for those accounts.

## What Changes

- **UI Balance Display**: Update `GLDataGrid.tsx` to render the pre-calculated `fsliBalance` for grouped FSLI rows instead of summing the individual zero-balance GL accounts.
- **Significance Calculations**: Refactor `GLDataGrid` aggregation functions for `balance`, `quantFlag`, and `finalStatus` to use the FSLI's pre-calculated balance (`fsliBalance`) when it is non-zero, rather than the sum of GL balances.
- **Excel Export Consistency**: Update the `handleExportExcel` function in `GLDataGrid.tsx` to use the `fsliBalance` for FSLI group rows in the exported file.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `gl-integration`: Update the scoping grid presentation, Excel export, and quantitative significance evaluation to respect `fsliBalance` as the primary source of truth for an FSLI group's total value, falling back to summing GL balances only when `fsliBalance` is zero or not provided.

## Impact

- **Components**: `src/components/scoping/GLDataGrid.tsx`
