## 1. Shared Types & Utilities

- [x] 1.1 Update `TestRecord['result']` enum in `shared/types.ts`.
- [x] 1.2 Add `TEST_RESULT_MAP` and `getTestResultLabel` helper in `lib/compliance-utils.ts`.

## 2. UI Updates (Testing Workbench)

- [x] 2.1 Update TOD button labels and mutation logic in `TestWorkbench.tsx`.
- [x] 2.2 Update TOE button labels and mutation logic in `TestWorkbench.tsx`.
- [x] 2.3 Update test result badges/labels in the testing history table.

## 3. Downstream Module Updates

- [x] 3.1 Update deficiency identification trigger logic in `TestWorkbench.tsx`.
- [x] 3.2 Update `RegulatoryAppendices.tsx` to use "Efektif/Tidak Efektif" labels.
- [x] 3.3 Ensure `DeficiencyBoard.tsx` handles "Ineffective" status correctly for filtering.

## 4. Verification & Migration

- [x] 4.1 Verify that recording an "Ineffective" result correctly creates a Deficiency.
- [x] 4.2 Validate Indonesian labels in regulatory report previews.
- [x] 4.3 Add a legacy data handler in `getTestResultLabel` to avoid breaking existing "Pass/Fail" records.
