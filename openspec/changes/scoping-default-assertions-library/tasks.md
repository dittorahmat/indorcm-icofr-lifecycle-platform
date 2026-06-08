## 1. Library Implementation

- [x] 1.1 Create `worker/services/scoping-defaults.ts` with the FSLI mapping constant.
- [x] 1.2 Implement `getQualitativeDefaults(fsliName: string)` helper with normalization (trim + lowercase).

## 2. API Integration

- [x] 2.1 Update `worker/routes/scoping.ts` POST `/api/simulations` handler.
- [x] 2.2 Add logic to fetch all unique FSLIs from the active snapshot.
- [x] 2.3 Populate the initial `assessmentData` object with library defaults before DB insertion.

## 3. Validation & Cleanup

- [x] 3.1 Run `npm run type-check` to ensure backend compatibility.
- [x] 3.2 Manually verify simulation creation in the UI to ensure defaults appear in the grid.
- [x] 3.3 Ensure "Kas dan Setara Kas" (and other standard items) are correctly mapped despite leading/trailing spaces in GL data.
