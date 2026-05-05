## 1. Backend Data & Schema

- [x] 1.1 Update `worker/user-routes.ts` to support granular results in `POST /api/csa`.
- [x] 1.2 Implement data transformation shim for legacy CSA records (boolean to object).
- [x] 1.3 Add validation logic to enforce mandatory evidence for 'Effective' results.

## 2. Frontend Interface Refactor

- [x] 2.1 Refactor `CSATabContent.tsx` into a dual-table layout (Matrix + Flattened).
- [x] 2.2 Remove evidence buttons from the Matrix table and ensure it remains as a summary Pass/Fail view.
- [x] 2.3 Implement the new Granular Evidence Table below the matrix with columns for Evidence, Remarks, and Deficiency.
- [x] 2.4 Implement synchronization logic so Pass/Fail toggles in either table update the other.
- [x] 2.5 Extract Risk/Control pairs dynamically from `diagram.nodes` for row labeling in the granular table.

## 3. UI/UX Polishing

- [x] 3.1 Implement row grouping by Sample ID with visual headers for better readability.
- [x] 3.2 Add a progress indicator showing "X of Y verification points completed".
- [x] 3.3 Ensure the "Zero Tolerance" logic applies across all granular points.

## 4. Verification

- [x] 4.1 Verify that 3 transactions x 2 controls correctly result in 6 granular rows.
- [x] 4.2 Confirm that individual evidence can be uploaded and retrieved for each point.
- [x] 4.3 Verify that sign-off is blocked if any granular point is missing evidence.
