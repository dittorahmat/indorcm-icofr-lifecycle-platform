## Context

The `SmartImportWizard` is the primary entry point for initializing a new ICOFR fiscal cycle. While it successfully handles data ingestion and RCM mapping, it currently fails to properly initialize the Materiality Simulation. The backend automatically creates an "Approved" simulation but leaves materiality percentages and the benchmark basis at zero/null. This forces users to navigate to the Scoping page to manually correct these values before they can proceed with any quantitative analysis.

## Goals / Non-Goals

**Goals:**
- Provide a UI in Step 3 of the Wizard to configure `basis`, `omPercentage`, and `haircutPercentage`.
- Display real-time previews of OM and PM values based on the uploaded TB data.
- Update the migration API contract to persist these materiality settings.
- Ensure the automatically created "Baseline" simulation is immediately usable for Scoping.

**Non-Goals:**
- Implementing the "Significant Location" selection in the Wizard (this remains in the separate modal/workflow for now).
- Changing how RCM data is processed.
- Allowing multiple simulations to be created during import (only the primary baseline).

## Decisions

### 1. In-Wizard Benchmark Discovery
Instead of fetching data from the backend after upload, the Wizard will aggregate the `parsedTbData` locally to identify unique FSLIs and their total absolute balances.
- **Rationale**: Provides immediate feedback without additional network round-trips.
- **Implementation**: Use a `useMemo` hook to group `parsedTbData` by `fsliName`.

### 2. Expanded API Contract
Modify the `POST /api/migration/finalize` payload to include a `simulationParams` object.
- **Structure**: `{ year, tbData, rcmData, simulationParams: { basis, omPercentage, haircutPercentage, locationCount } }`.
- **Rationale**: Centralizes the finalization logic and ensures atomic creation of the Snapshot and its corresponding Simulation.

### 3. Shared Calculation Logic
The Wizard will import and use `getGroupMultiplier`, `calculateOM`, and `calculatePM` from `src/pages/scoping/services/materiality-calc.ts`.
- **Rationale**: Ensures consistency between the Wizard's preview and the actual values stored/displayed in the Scoping module.

### 4. Smart Defaults
- Default OM: 5% (Standard for FSLI-based benchmarks).
- Default Haircut: 25% (Standard conservative starting point).
- Default Location Count: 1.

## Risks / Trade-offs

- **[Risk]** State Desync: If the user goes back to Step 2 and changes FSLI mappings, the benchmark list in Step 3 might become stale. 
  → **Mitigation**: The benchmark aggregation logic will depend on `parsedTbData`, and we will ensure `parsedTbData` is updated if normalization changes (though currently, normalization in Step 2 mostly affects RCM data; TB data is "normalized" during the parser phase).
- **[Risk]** Client-side Performance: Calculating aggregates for >10,000 GL rows might cause UI lag.
  → **Mitigation**: The aggregation is a simple O(n) pass. For the typical enterprise GL (~5k-20k rows), this is sub-100ms. We will wrap it in `useMemo`.
