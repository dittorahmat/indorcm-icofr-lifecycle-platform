## 1. Safety & Stability

- [x] 1.1 Fix runtime crash in `getEnrichedControlData` by adding null checks for `controlsData?.items`.

## 2. Refactor Docking Logic

- [x] 2.1 Refactor `linkRiskToActivity` to use a single `setNodes` call for both data update and badge node management.
- [x] 2.2 Refactor `linkControlToRisk` to consolidate all node updates (Activity data + docked-control node) into a single atomic `setNodes` closure.
- [x] 2.3 Standardize all docked node positions (Risks and Controls) to `y: -12` to ensure consistent top-docking.

## 3. Verification

- [x] 3.1 Verify that linking a new control immediately renders the green circle badge.
- [x] 3.2 Verify that the editor does not crash on initial load when master data is pending.
