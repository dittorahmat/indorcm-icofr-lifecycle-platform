## 1. Database & Schema

- [x] 1.1 Update `worker/db/schema.ts` to add `year` column to `bpmDiagrams`, `rcms`, `controls`, and `rcmControls`.
- [x] 1.2 Generate Drizzle migration using `npx drizzle-kit generate`.
- [x] 1.3 Run Drizzle migration using `npx drizzle-kit push` or equivalent.
- [x] 1.4 Update migration script `worker/db/migrate-2024.ts` to include `rcmControls`.
- [x] 1.5 Execute the migration script to normalize existing 2024 data.

## 2. API Implementation (Carry Forward)

- [x] 2.1 Update `MaterialitySimulation` interface in `shared/types.ts` to reflect mandatory year.
- [x] 2.2 Modify `POST /api/simulations` in `worker/user-routes.ts` to accept `year`.
- [x] 2.3 Implement "Carry Forward" logic in `POST /api/simulations`: check for previous year data and clone BPM/RCM/Control structures (including `rcm_controls` metadata).
- [x] 2.4 Update listing endpoints for Simulations, BPM, and RCM to support year-based filtering.

## 3. Frontend - Scoping Page

- [x] 3.1 Update `SimulationInitialForm` in `ScopingPage.tsx` to include a mandatory Year selector.
- [x] 3.2 Implement year-based filtering in the `SimulationListTable`.
- [x] 3.3 Add localization for new year-related labels in `src/i18n/`.
- [x] 3.4 Integrate `UnsavedChanges` warning in the Scoping Simulation creation flow.

## 4. Frontend - BPM & RCM Awareness

- [x] 4.1 Update `BPMPage.tsx` to handle year selection (from URL params or global state).
- [x] 4.2 Add visual indicators (Badges) for the currently viewed Fiscal Year.
- [x] 4.3 Implement read-only logic for diagrams/RCMs from previous years.
- [x] 4.4 Ensure diagram edits are scoped correctly to the current year.

## 5. Verification & Cleanup

- [x] 5.1 Verify simulation creation for Year 2025 triggers data cloning.
- [x] 5.2 Verify Year 2024 data remains unchanged after 2025 edits.
- [x] 5.3 Verify `UnsavedChanges` warning triggers correctly on Scoping Page.
- [x] 5.4 Final localization check for all Indonesian/English strings.
