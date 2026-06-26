## Why

Regulation SK-5/DKU.MBU/11/2024 requires state-owned enterprise (BUMN) scoping to meet two conditions: FSLI-level coverage of at least 2/3 (66.67%) of the consolidated value of each FSLI, and aggregate coverage of at least 2/3 (66.67%) of consolidated operating values (Total Assets, Total Liabilities, Total Revenue, Total Expenses) across selected in-scope entities. The current scoping system does not calculate or display this compliance status, leaving a gap in compliance.

## What Changes

- Add automatic calculation of the 2/3 (66.67%) coverage rule for each FSLI (Condition A) and overall operating values (Condition B) when filtering entities/locations.
- Add specific color highlighting in the GL grid to distinguish the reasons a row is in scope:
  - Green for accounts exceeding Performance Materiality (PM).
  - Orange/Amber for accounts included to satisfy the 2/3 coverage requirement.
  - Yellow for accounts included due to qualitative factors.
- Add visual indicators in `ScopingHealthDashboard` and `SignificantLocationModal` showing whether the 2/3 rule is satisfied.

## Capabilities

### New Capabilities
- `two-thirds-scoping-compliance`: Calculates FSLI-level and aggregate operating value coverage of selected entities against the 2/3 (66.67%) threshold and highlights rows in the grid with specific color codes (Green, Orange, Yellow) based on SK-5/2024 compliance.

### Modified Capabilities
None.

## Impact

- Frontend: `GLDataGrid.tsx`, `ScopingHealthDashboard.tsx`, `SignificantLocationModal.tsx`, `useScopingPage.ts`
- Translation: `scoping.json` (locales/en and locales/id)
