## Context

The Reports Page currently uses hardcoded "PASS" and "FAIL" labels for test results in the TOD/TOE table. This deviates from Regulation SK-5/2024 which requires "Efektif" (Effective) and "Tidak Efektif" (Ineffective). The `TestWorkbench.tsx` already uses the correct terminology via the `getTestResultLabel` helper.

## Goals / Non-Goals

**Goals:**
- Replace hardcoded "PASS/FAIL" strings in `ReportsPage.tsx` with compliant labels.
- Standardize on the `getTestResultLabel` helper from `lib/compliance-utils.ts`.
- Ensure consistent color coding (Green for Effective, Red for Ineffective).

**Non-Goals:**
- Changing the underlying data model (already handled by a previous change).
- Modifying the logic for determining test results.

## Decisions

### 1. Unified Terminology Helper & i18n
We will utilize the existing `getTestResultLabel` from `src/lib/compliance-utils.ts` and wrap the output with `i18next` translations.
- **New i18n Keys** in `reports.json`:
  ```json
  {
    "testing": {
      "effective": "Efektif",
      "ineffective": "Tidak Efektif"
    }
  }
  ```
*Rationale*: Centralizes compliance logic and ensures that the UI respects the user's selected language while remaining compliant with SK-5.

### 2. Database Schema Refinement
Although `shared/types.ts` is updated, the Drizzle schema comment for `test_records.result` still references "Pass/Fail". We will update the schema to explicitly mention "Effective/Ineffective" and generate a migration.
- **Migration Command**: `bun x drizzle-kit generate`
- **Data Integrity**: If "Pass/Fail" strings exist in the DB, the `getTestResultLabel` helper already handles them as legacy, but a data migration to update existing records to "Effective/Ineffective" is recommended for consistency.

## Risks / Trade-offs

- **Risk**: i18n keys might be missing in one of the languages.
  - **Mitigation**: Add keys to both `en/reports.json` and `id/reports.json` simultaneously.
- **Risk**: Drizzle migration might conflict with other concurrent changes.
  - **Mitigation**: Run `git pull` and verify recent migrations before generating.

