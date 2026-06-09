## 1. Schema & Types

- [x] 1.1 Update `worker/db/schema.ts` to add `fsliBalance` to the `glRows` table definition.
- [x] 1.2 Update `shared/types.ts` to add `fsliBalance` to the `GLRow` interface.
- [x] 1.3 Apply schema changes to the database using `npx drizzle-kit push`.

## 2. Parser & Mapping

- [x] 2.1 Update `GL_COLUMN_MAPPING` in `src/lib/compliance-utils.ts` to include `fsliBalance` with relevant aliases (e.g., 'FSLI_Balance', 'Saldo_FSLI').
- [x] 2.2 Update `parseGLFile` in `src/pages/scoping/services/gl-parser.ts` to extract and parse the `fsliBalance` column.
- [x] 2.3 Update the data mapping in `SmartImportWizard.tsx` (within `handleProcessAI`) to include `fsliBalance` in the `parsedTbData` state.

## 3. UI Logic Refinement

- [x] 3.1 Refactor the `uniqueFsliData` calculation in `src/components/scoping/SetBenchmarkModal.tsx` to use `fsliBalance` as the primary total source (with fallback to `sum(balance)`).
- [x] 3.2 Refactor the `uniqueFsliData` calculation in `src/components/scoping/SmartImportWizard.tsx` to use `fsliBalance` as the primary total source (with fallback to `sum(balance)`).

## 4. Verification

- [ ] 4.1 Upload the demo Excel file (`demo/Laporan Keuangan_20251231_Demo SMI_v4.xlsx`) and verify that FSLIs with zero individual account balances (like PENDAPATAN) now display the correct non-zero total.
- [ ] 4.2 Verify that selecting these FSLIs as a benchmark correctly updates the calculated OM and PM values.
