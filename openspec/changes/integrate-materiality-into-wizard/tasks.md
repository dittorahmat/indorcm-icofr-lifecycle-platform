## 1. Frontend: State & Logic Integration

- [x] 1.1 Add materiality state variables to `SmartImportWizard.tsx` (basis, omPercentage, haircutPercentage, locationCount).
- [x] 1.2 Implement `uniqueFsliData` useMemo hook to aggregate `parsedTbData` by FSLI name and calculate total absolute balances.
- [x] 1.3 Import calculation utilities (`getGroupMultiplier`, `calculateOM`, `calculatePM`) from `src/pages/scoping/services/materiality-calc.ts`.

## 2. Frontend: UI Implementation

- [x] 2.1 Add "Materiality Configuration" section to Step 3 (Baselining) of the Wizard.
- [x] 2.2 Implement Benchmark Basis selector (Select component) populated with aggregated FSLI data.
- [x] 2.3 Implement numeric inputs for OM% and Haircut% with standard defaults (5% and 25%).
- [x] 2.4 Add live preview panel showing calculated OM and PM values.

## 3. Backend & API

- [x] 3.1 Update `handleFinalize` in `SmartImportWizard.tsx` to send `simulationParams` in the request body.
- [x] 3.2 Update `/api/migration/finalize` route in `worker/routes/migration.ts` to destructure `simulationParams`.
- [x] 3.3 Modify the `db.insert(schema.simulations)` call to use the passed parameters and calculated values.
- [x] 3.4 Ensure the backend calculates `om_value` and `pm_value` if not provided, or uses provided ones.

## 4. Verification & Testing

- [ ] 4.1 Perform a full GL import flow and verify the "Baselining" step shows correct benchmark candidates.
- [ ] 4.2 Verify the final simulation record in the database has non-zero `om_percentage`, `om_value`, etc.
- [ ] 4.3 Check the Scoping page after import to ensure the "Approved" simulation is fully initialized and functional.
