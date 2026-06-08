## 1. Backend Service Refinement

- [x] 1.1 Update `BpmService.ts` method signatures (`syncRisk`, `syncControl`, `syncRcmControlMapping`) to accept `year: number | null`.
- [x] 1.2 Modify `updateDiagram` in `BpmService.ts` to derive the diagram's year and pass it down to all sync methods.
- [x] 1.3 Enhance `bpmProcessId` resolution in `updateDiagram` to include `year` and `organizationId` filtering with trimmed/lowered name matching.
- [x] 1.4 Implement backfill logic in `syncRisk` and `syncControl` to update existing records if their `year` is currently null.

## 2. Validation & Testing

- [x] 2.1 Verify that saving a BPM Editor diagram correctly populates the `year` field in the `rcms` and `controls` tables.
- [x] 2.2 Verify that the RCM TLC tab in the Execution Hub (BPMModal) now correctly displays data created via the BPM Editor.
- [x] 2.3 Ensure that existing records with null years are repaired upon the next save of their parent diagram.

## 3. Maintenance

- [x] 3.1 Run `npm run type-check` to ensure no regressions in service layer types.
- [x] 3.2 Run `npm test` to verify overall system stability.
