## Why

The application currently has fragmented fiscal year management, where each page (Scoping, BPM, RCM, Migration) maintains its own local year state or relies on URL parameters. This lack of synchronization creates data integrity risks and a confusing user experience. Additionally, the recently implemented Smart Migration feature is currently a frontend mock-up and needs to be connected to a real backend engine to perform actual database insertions.

## What Changes

- **Global Fiscal Year Context**: Introduction of a centralized state management for the "Working Fiscal Year" (reporting context).
- **Header-Based Year Selector**: A global dropdown in the `MainHeader.tsx` to control the reporting year across all operational modules.
- **Migration Engine Realization**: Implementation of actual backend logic to process staged migration data and insert it into production tables (`gl_snapshots`, `simulations`, `controls`, `rcms`).
- **Data Synchronization**: Refactoring of Scoping, BPM, and RCM pages to subscribe to the global fiscal year state instead of local state or isolated URL parameters.
- **Contextual To-do Separation**: Ensuring the "To-do List" and "Notifications" remain anchored to the real-world calendar year while operational data follows the selected fiscal year.

## Capabilities

### New Capabilities
- `global-fiscal-year-selector`: Unified time-context control for the entire application shell.
- `migration-backend-engine`: Real-world database realization for imported brownfield data.

### Modified Capabilities
- `scoping-management`: Requirements updated to rely on global fiscal year state.
- `rcm-risk-control-accordion`: Requirements updated to rely on global fiscal year state.
- `gl-integration`: Requirements updated to support automated record creation from the migration engine.

## Impact

- `src/components/layout/MainHeader.tsx`: Addition of the global year dropdown.
- `src/store/useFiscalYearStore.ts`: New Zustand store for global state.
- `src/pages/migration/MigrationPage.tsx`: Logic update to call the real backend API.
- `worker/routes/migration.ts`: New backend routes for processing migration data.
- `src/pages/scoping/ScopingPage.tsx` & `src/pages/bpm/BPMPage.tsx`: Refactoring to use global state.
