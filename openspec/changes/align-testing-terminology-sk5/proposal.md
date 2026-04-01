## Why

The current testing terminology ("Pass" and "Fail") in the Testing Workbench does not align with the mandatory reporting standards of Regulation SK-5/DKU.MBU/11/2024. The regulation (Bab V & VII) explicitly requires conclusions to be stated as **"Efektif"** or **"Tidak Efektif"**. This change ensures regulatory compliance and addresses user feedback regarding terminology accuracy.

## What Changes

- **Data Model Migration (BREAKING)**: Update `TestRecord['result']` type from `'Pass' | 'Fail'` to `'Effective' | 'Ineffective'`.
- **UI Update (Testing Workbench)**: Rename buttons "Pass TOD/TOE" to **"Effective"** and "Fail TOD/TOE" to **"Not Effective"**.
- **UI Update (Labels)**: Replace all occurrences of "Pass/Fail" labels in tables and badges with "Efektif/Tidak Efektif" (using Indonesian translation for regulatory reports).
- **Synchronization Logic**: Update the logic that triggers deficiency creation to look for the `'Ineffective'` result.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `deficiency-management`: Update the trigger for deficiency identification to use the new "Ineffective" conclusion status.

## Impact

- **Shared Types**: `shared/types.ts` update to `TestRecord`.
- **Components**: `TestWorkbench.tsx`, `DeficiencyBoard.tsx`, and `RegulatoryAppendices.tsx` will need UI label updates.
- **Data**: Existing "Pass/Fail" data in local storage or mock state will need migration to the new enum values.
