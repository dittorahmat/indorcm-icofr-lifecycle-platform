## 1. Backend Implementation

- [x] 1.1 Update `worker/routes/migration.ts` to extract `tbFileName` from the request body in the `/migration/finalize` endpoint.
- [x] 1.2 Update the `db.insert(schema.glSnapshots)` call to use `tbFileName` (with a fallback) for the `filename` field.

## 2. Frontend Implementation

- [x] 2.1 Update `src/components/scoping/SmartImportWizard.tsx` within the `handleFinalize` function to include `tbFileName: tbFile?.name` in the payload sent to `/api/migration/finalize`.

## 3. Verification

- [ ] 3.1 Upload a GL file in the Smart Import Wizard and finalize the import.
- [ ] 3.2 Verify that the GL snapshot created in the database has the original filename instead of the hardcoded `Migration_*` format.
