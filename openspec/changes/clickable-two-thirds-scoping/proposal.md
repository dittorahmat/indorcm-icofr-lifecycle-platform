## Why

Accounts that fall under the two-thirds scoping rule (Condition A/B compliance) are currently identified and classified in the database and data structures, but are not clickable or interactive in the GL data grid UI (`GLDataGrid.tsx`). This prevents Line 1 owners from assigning applications or navigating to the BPM workflow editor for these compliance-scoped accounts.

## What Changes

- Update `GLDataGrid.tsx` to enable links/interactivity (clickability) for accounts classified as `two-thirds` scoping compliance.
- Enable the significant applications (`significantApp`) selection for accounts classified as `two-thirds`.
- Ensure the scope status badge reflects the `two-thirds` category as `In Scope` appropriately.
- Simplify/refactor the `isInScope` check in `GLDataGrid.tsx` to directly leverage the `row.original.scopeClassification` property computed by the page hook.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `two-thirds-scoping-compliance`: Ensure all accounts classified under the 2/3 scoping compliance rule are fully interactive (clickable BPM links and application mapping enabled) in the scoping page data grid.

## Impact

- Frontend UI: `src/components/scoping/GLDataGrid.tsx`
