## Why
Internal Audit (Line 3) needs a standardized report for Test of Design (TOD) and Test of Operating Effectiveness (TOE) results that complies with SK-5/DKU.MBU/11/2024. Currently, these results are only visible in the Testing Workbench, but they must be exportable and presentable in a formal audit summary format.

## What Changes
- **Reports Page Update**:
  - Implement the "Laporan Hasil Pengujian" tab in `ReportsPage.tsx`.
  - Add a detailed data table aggregating all `TestRecord` data linked to their respective `Control` metadata.
  - Implement visual indicators for the 6 mandatory evaluation attributes (Tabel 21).
  - Add filtering by Test Type (TOD vs TOE) and Result (Pass vs Fail).
  - Include specific columns for TOE like Population Size and Sample Size as required by the regulation.

## Capabilities
### New Capabilities
- `regulatory-testing-report`: Standardized report view for TOD and TOE results.

### Modified Capabilities
- None

## Impact
- `src/pages/reports/ReportsPage.tsx`: New UI implementation for the audit results tab.
- `shared/types.ts`: No changes (existing types are sufficient).
