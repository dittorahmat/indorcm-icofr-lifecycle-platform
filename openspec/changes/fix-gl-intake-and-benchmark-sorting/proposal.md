## Why

The current GL data intake process incorrectly filters out essential FSLI subtotal rows (like "TOTAL ASET") when the account description is empty. Additionally, the benchmark basis selection modal lacks hierarchical sorting based on the financial statement's natural order (`no_urut`), making it difficult for users to find key figures quickly.

## What Changes

- **Preserve FSLI Subtotals**: Modify GL parsing logic to retain rows that have a valid `fsliName` even if the `glDesc` (account description) is empty, ensuring totals like "TOTAL ASET" are available for scoping.
- **Hierarchical Benchmark Sorting**: Update the `SetBenchmarkModal` to group and sort FSLIs by their minimum `no_urut` found in the GL data, reflecting the natural order of the financial statements.
- **UnSavedChanges Guard**: Implement the `useUnsavedChanges` hook in the scoping and benchmark selection flows to prevent data loss.
- **Localization**: Ensure all UI strings in modified components are fully localized in Indonesian and English.
- **Notification Integration**: Add visual feedback via a notification bell/toast system for successful benchmark configuration.
- **Code Hygiene**: Refactor identified code smells in the scoping module while maintaining API integrity and applying SOLID/DRY principles.

## Capabilities

### New Capabilities
- `gl-intake-resilience`: Handles GL data import with tolerance for empty account descriptions when FSLI categorization is present.
- `hierarchical-benchmark-sorting`: Provides a sorted view of FSLIs in the benchmark basis modal based on the lowest `no_urut` per group.

### Modified Capabilities
- `gl-integration`: Update data filtering rules to include FSLI-only rows (subtotals).
- `unsaved-changes-guard`: Extend protection to the materiality benchmark selection workflow.

## Impact

- **Affected Components**: `GLDataIntake.tsx`, `SetBenchmarkModal.tsx`, `gl-parser.ts`, `compliance-utils.ts`.
- **APIs**: No breaking changes to existing API signatures expected, but data payloads will now include FSLI-only rows.
- **Data Model**: No schema changes required (schema already supports `no_urut` and `fsliName`), but data consistency will be improved.
