## Why

Currently, the columns "Lini 1 Owner" and "Owner Acceptance" are placed in the middle of the scoping General Ledger Data Grid (`GLDataGrid`), which disrupts the reading flow of account balances and qualitative assessments. Moving these columns to the far right, after the "Application Significant" column, improves the layout's visual hierarchy and aligns better with user expectations for assessment workflows.

## What Changes

* Reorder the columns in `GLDataGrid` so that "Lini 1 Owner" (`departmentOwner`) and "Owner Acceptance" (`ownerAcceptance`) are positioned at the far right.
* Ensure they are rendered immediately after the "Application Significant" (`significantApp`) column.
* Verify that the column reordering does not affect the existing column sizing, filtering, sorting, or grouping functionalities.

## Capabilities

### New Capabilities
* None

### Modified Capabilities
- gl-integration: Reorder scoping grid columns to move Lini 1 Owner and Owner Acceptance columns to the far right.

## Impact

* **Frontend**: `src/components/scoping/GLDataGrid.tsx` - Reordering elements in the `columns` array of `useReactTable`.
