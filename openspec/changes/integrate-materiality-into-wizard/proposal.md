## Why

The current GL/TB upload process in `SmartImportWizard.tsx` automatically creates an "Approved" materiality simulation in the backend, but it lacks essential materiality parameters (Benchmark Basis, OM %, PM %, Haircut %). This results in simulations with 0% values, making quantitative significance calculations impossible without manual post-migration steps. Integrating benchmark selection and materiality configuration into the Wizard ensures a seamless, valid, and immediately actionable baseline.

## What Changes

- **Wizard UI Update**: Add a "Materiality Configuration" section to Step 3 (Baselining) of the `SmartImportWizard`.
- **Benchmark Discovery**: Implement logic to aggregate GL data by FSLI and suggest top benchmark candidates (e.g., Revenue, PBT) within the Wizard.
- **Materiality Preview**: Real-time calculation and display of Overall Materiality (OM) and Performance Materiality (PM) values based on user input.
- **Backend Sync**: Update the `/api/migration/finalize` endpoint to accept `simulationParams` and use them when creating the initial simulation.
- **Data Integrity**: Ensure the initial simulation created during migration is fully populated with valid materiality parameters.

## Capabilities

### New Capabilities
- `wizard-materiality-config`: Capability to configure, calculate, and preview materiality parameters (Basis, OM%, Haircut%) within the import wizard flow.

### Modified Capabilities
- `materiality-scoping`: Updating the requirement for how simulations are initialized and "Approved" during the automated migration/import phase.

## Impact

- **Frontend**: `SmartImportWizard.tsx` (State management, UI integration), `IntelligenceDashboard.tsx` (Potential summary update).
- **Backend**: `worker/routes/migration.ts` (Finalize logic update).
- **Shared**: `shared/types.ts` (API payload interface update), `materiality-calc.ts` (Reuse of calculation utilities).
- **UX**: Eliminates the need for manual post-upload configuration in `SetBenchmarkModal` and `ScopingSimulationForm`.
