## 1. Backend Service Refactor (BpmService)

- [x] 1.1 Update `updateDiagram` in `worker/services/bpm-service.ts` to strictly include `year` in the `BPMProcess` resolution query to avoid legacy matching.
- [x] 1.2 Modify `syncRisk` to update `year`, `process`, and `subProcess` fields for existing records on every save.
- [x] 1.3 Modify `syncControl` to update `year`, `businessProcess`, and `subProcess` fields for existing records on every save.
- [x] 1.4 Ensure `syncControl` updates the `bpmProcessId` linkage even for existing records based on the resolved process ID.

## 2. API Filtering Hardening

- [x] 2.1 Update `/api/rcm-matrix/tlc` in `worker/routes/rcm.ts` to strictly validate and filter by the `year` query parameter.
- [x] 2.2 Update `/api/bpm-processes` in `worker/routes/bpm.ts` to support strict `year` filtering and ensure the frontend provides it.

## 3. Data Remediation (Backfill Script)

- [x] 3.1 Create `scripts/backfill-rcm-tlc-sync.ts` as a robust replacement for existing repair scripts.
- [x] 3.2 Implement logic to assign missing `year` values to `BPMProcess` records by cross-referencing their associated `BPMDiagrams`.
- [x] 3.3 Implement a recursive update to align `rcms.year` and `controls.year` with their parent diagrams/processes.
- [x] 3.4 Execute the backfill script in the production-like environment and verify the results.

## 4. Verification

- [x] 4.1 Verify that saving a diagram for the year 2026 correctly propagates all metadata to the RCM TLC tab.
- [x] 4.2 Confirm that renaming a sub-process in the BPM Editor immediately updates the labels in the RCM Matrix view.
- [x] 4.3 Verify that the RCM Matrix no longer displays "ghost" records with NULL years or mismatched process linkages.
