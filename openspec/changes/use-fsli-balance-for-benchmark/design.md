## Context

The IndoGRC platform allows users to upload General Ledger (GL) data to perform materiality scoping. The system groups GL accounts by Financial Statement Line Item (FSLI) and calculates a total balance for each FSLI to be used as a "Benchmark Basis" (e.g., Total Assets, Total Revenue). 

Current implementation sums the `GL_Balance` field for all accounts within an FSLI. However, the SK-5/2024 template used by several SOEs provides pre-calculated totals in an `FSLI_Balance` column, while individual account balances (`GL_Balance`) may be zero for presentation purposes in the source file.

## Goals / Non-Goals

**Goals:**
- Capture and persist the `FSLI_Balance` value from source files.
- Use the provided `FSLI_Balance` as the source of truth for benchmark calculations.
- Maintain backward compatibility for files that do not have the `FSLI_Balance` column (by falling back to the sum of `GL_Balance`).

**Non-Goals:**
- Recalculating or validating the `FSLI_Balance` provided in the Excel file against the sum of accounts.
- Modifying historical simulations already created.

## Decisions

### 1. Database Schema Extension
**Decision:** Add `fsliBalance` as a `doublePrecision` column to the `glRows` table.
- **Rationale:** Persisting this value is necessary to avoid re-parsing the file every time a benchmark is selected.
- **Alternatives Considered:** Storing it in a separate aggregate table. *Rejected* because it complicates the relationship and requires extra JOINs during scoping. Storing it on each row is denormalized but efficient for the current "Snapshot" architecture.

### 2. Column Detection and Parsing
**Decision:** Update `GL_COLUMN_MAPPING` in `compliance-utils.ts` to include `fsliBalance`.
- **Rationale:** Ensures the parser can automatically find the correct column across different file variants (e.g., "FSLI Balance", "Saldo FSLI").

### 3. UI Calculation Logic
**Decision:** Update `SetBenchmarkModal.tsx` and `SmartImportWizard.tsx` to use the `fsliBalance` of the first row in an FSLI group as the "Total Balance".
- **Rationale:** Since all accounts in an FSLI group share the same FSLI-level total, taking the value from any row (typically the first) is efficient. 
- **Fallback:** If `fsliBalance` is 0 or null, the system will fall back to the existing `sum(abs(balance))` logic to ensure backward compatibility.

## Risks / Trade-offs

- **[Risk] Data Redundancy** → Each row in an FSLI group stores the same `fsliBalance`. 
  - **Mitigation:** The storage overhead is negligible compared to the complexity of a separate normalization step in the current Workers/Durable Objects environment.
- **[Risk] Inconsistent FSLI Balance in Source** → If a source file has different `FSLI_Balance` values for accounts in the same FSLI.
  - **Mitigation:** The parser extracts whatever is in that row. The UI will take the first encountered value. This reflects the "as-is" nature of the management report provided by the user.
