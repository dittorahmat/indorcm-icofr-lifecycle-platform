## 1. Backend Implementation

- [x] 1.1 Update `worker/routes/migration.ts` to filter `tbData` for significant accounts based on `simulationParams.pmValue`.
- [x] 1.2 Map the filtered GL rows to the `SignificantAccount` structure (name, balance, isQuantitative, fsliCode).
- [x] 1.3 Ensure the `significantAccounts` array is passed to the simulation `insert` operation instead of an empty array.

## 2. Verification

- [x] 2.1 Manually test the "Smart Import" wizard with a sample GL file and verify the BPM Page dropdown is populated.
- [x] 2.2 Verify that the `significantAccounts` data in the database matches the accounts seen as significant in the Scoping matrix UI.
