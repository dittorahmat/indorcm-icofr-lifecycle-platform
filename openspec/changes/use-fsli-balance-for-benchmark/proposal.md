## Why

The current system calculates FSLI totals by summing individual account balances (`GL_Balance`). In the new SK-5/2024 template used by many SOEs (BUMN), individual account balances are often zero in the source file, while the total FSLI balance is provided in a separate `FSLI_Balance` column. This discrepancy causes FSLI benchmarks in the scoping module to appear as zero, preventing accurate quantitative materiality assessment.

## What Changes

- **Database Schema Update**: Add `fsliBalance` column to the `gl_rows` table to store the pre-calculated FSLI total from the source file.
- **Data Parser Enhancement**: Update the GL parser to detect and extract the `FSLI_Balance` column during Excel/CSV import.
- **Benchmark Calculation Logic**: Modify the Scoping module to use the distinct `FSLI_Balance` value per FSLI group as the source for benchmark totals, instead of summing individual `GL_Balance` entries.
- **UI Consistency**: Ensure `SetBenchmarkModal` and `SmartImportWizard` display the correct total balance reflecting the source file's FSLI totals.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `gl-integration`: Update requirements to include extraction and storage of `FSLI_Balance`, and utilize it as the primary source for benchmark value calculations.

## Impact

- **Database**: `gl_rows` table schema in PostgreSQL (Drizzle).
- **Types**: `GLRow` interface in `shared/types.ts`.
- **Services**: `gl-parser.ts` extraction logic and `compliance-utils.ts` column detection.
- **Components**: `SetBenchmarkModal.tsx` and `SmartImportWizard.tsx` calculation logic.
