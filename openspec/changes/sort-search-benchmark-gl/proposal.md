## Why

In the Smart Import Wizard's Baselining step on the Scoping Page, setting the benchmark basis currently displays candidate FSLI/GL items sorted by balance in descending order without search capability. Users with extensive GL datasets need items ordered by their sequence number (`no_urut` ascending) and an inline search/filter input to locate specific benchmark accounts quickly.

## What Changes

- Sort benchmark basis candidate items in `SmartImportWizard` by `minNoUrut` ascending, falling back to name comparison.
- Replace/enhance the benchmark basis selection dropdown in `SmartImportWizard` with a searchable Combobox interface (supporting search filtering by name and display of sequence number and formatted balance).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `scoping-ui-layout-and-sorting-refactor`: Updated benchmark basis selection list in Smart Import Wizard to be sorted by `noUrut` (ascending) and searchable via input query.

## Impact

- `src/components/scoping/SmartImportWizard.tsx`: Refactored sorting logic for `uniqueFsliData` and replaced `<Select>` with a searchable Popover + Command Combobox component.
