## 1. Table Grouping Configuration

- [x] 1.1 Implement dynamic grouping column selection in `GLDataGrid.tsx` based on the number of unique entities and parent-child relations.
- [x] 1.2 Update the `useReactTable` state initialization in `GLDataGrid.tsx` to set the default grouping to the dynamically computed columns.

## 2. Table Column Definitions & Cell Renderers

- [x] 2.1 Update the `fsliName` column cell renderer to display appropriate labels ("Parent Entity: [Code]", "Entity: [Code]", "[FSLI Name]") depending on `row.groupingColumnId`.
- [x] 2.2 Add expand/collapse chevron buttons and toggle handlers for all grouped rows in the `fsliName` column cell.
- [x] 2.3 Define `aggregationFn: 'sum'` for the `balance` column definition.
- [x] 2.4 Define a custom aggregation function for the `finalStatus` column so that parent/grouped rows show "In Scope" if any sub-node or GL account in that group is in scope.
- [x] 2.5 Define a custom aggregation function for the `quantFlag` column to display "Significant" if the aggregated balance is greater than or equal to `pmValue`.

## 3. Testing & Verification

- [x] 3.1 Verify indentations and layout alignment for nested entity and FSLI rows.
- [x] 3.2 Run regulatory verification using the bank financial report XLSX file.
- [x] 3.3 Run type check, lint, and tests using `npm run type-check`, `npm run lint`, and `npm test`.
