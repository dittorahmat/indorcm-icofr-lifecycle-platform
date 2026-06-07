## 1. Frontend: Regulatory Property Sheet Fix

- [x] 1.1 Update `addControlToRisk` in `src/components/rcm/properties/RegulatoryPropertySheet.tsx` to generate a permanent `controlId` (prefixed with `C-`) using `crypto.randomUUID()`.
- [x] 1.2 Update `addNewRisk` in `src/components/rcm/properties/RegulatoryPropertySheet.tsx` to ensure `controlId` is also initialized with a permanent ID instead of a temp one if necessary (for consistency).
- [x] 1.3 Verify that `_tempControlId` and `controlId` are consistently assigned the same value in both functions.

## 2. Frontend: State Synchronization

- [x] 2.1 Audit `updateSpecificControl` and `updateAllPairsForRisk` in `RegulatoryPropertySheet.tsx` to ensure they don't accidentally wipe out the generated IDs.
- [x] 2.2 Verify that `BPMEditor.tsx`'s `updateNodeData` function correctly handles the multiple pairs in `regulatoryPairs` for visual feedback (badges).

## 3. Verification & Testing

- [x] 3.1 Manually verify that adding a second control to a risk in the BPM Editor results in two entries in the `RegulatoryPropertySheet`.
- [x] 3.2 Verify that after clicking "Save & Sync", both controls are persisted and visible after a page refresh.
- [x] 3.3 Check the browser Network tab to confirm the payload sent to `/api/bpm-diagrams/:id` contains valid `controlId` strings for all controls.
- [x] 3.4 Verify that there is no UI flicker or accordion collapse when typing descriptions into newly added controls.
