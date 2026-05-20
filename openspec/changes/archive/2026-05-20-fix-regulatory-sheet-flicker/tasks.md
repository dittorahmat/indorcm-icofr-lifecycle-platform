## 1. Stabilization of IDs

- [x] 1.1 Update `addNewRisk` in `RegulatoryPropertySheet.tsx` to generate a permanent `riskId` using `crypto.randomUUID()` immediately.
- [x] 1.2 Update `addControlToRisk` in `RegulatoryPropertySheet.tsx` to generate a permanent `controlId` immediately.
- [x] 1.3 Remove lazy ID assignment logic from `updateAllPairsForRisk` function.
- [x] 1.4 Remove lazy ID assignment logic from `updateSpecificControl` function.

## 2. Component Identity Fix

- [x] 2.1 Verify that the Risk Header card uses the stable `riskId` as its React `key`.
- [x] 2.2 Verify that `AccordionItem` uses the stable `controlId` as both its `key` and `value`.
- [x] 2.3 Test input behavior to confirm no flickering occurs when typing risk descriptions.
- [x] 2.4 Test input behavior to confirm no accordion collapse occurs when typing control descriptions.
