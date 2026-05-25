## Why

The application currently has two separate entry points for uploading financial data: a standard upload on the Scoping page and an AI-assisted "Smart Migration" page. This redundancy causes user confusion and a fragmented experience. By unifying these into a single "Smart Import" modal within the Scoping page, we provide a more intuitive, powerful, and safe onboarding process for both legacy (brownfield) and routine data updates, while cleaning up the application's navigation.

## What Changes

- **Smart Import Unification**: The standalone "Smart Migration" page and its sidebar entry will be REMOVED.
- **Scoping Integration**: The "Upload GL" button on the Scoping page will be refactored to launch a new `SmartImportWizard` modal.
- **Hybrid Ingestion**: The new wizard will support uploading Trial Balance (TB) only, or TB and Risk Control Matrix (RCM) simultaneously, utilizing the AI normalization engine.
- **Legacy Template Support**: The AI engine will be verified to support existing CSV templates with 100% confidence, ensuring no loss of functionality for disciplined users.
- **Backend "Active" Logic**: Update the migration finalization logic to ensure imported TB data is automatically set to `isActive: true` so it populates the Scoping tables immediately upon modal closure.
- **Navigation Cleanup**: Remove the `/rcm/migration` route and associated localized sidebar strings.

## Capabilities

### New Capabilities
- `smart-import-wizard`: Integrated modal-based ingestion flow within the Scoping module.

### Modified Capabilities
- `scoping-management`: Now serves as the primary and only entry point for all organizational data ingestion.
- `migration-backend-engine`: Updated to support direct "active" data injection into Scoping.

## Impact

- `src/pages/scoping/ScopingPage.tsx`: Primary integration point for the new wizard.
- `src/pages/migration/MigrationPage.tsx`: **REMOVAL** of this file.
- `src/components/scoping/SmartImportWizard.tsx`: New component encapsulating the migration logic.
- `src/main.tsx`: Removal of the migration route.
- `src/components/app-sidebar.tsx`: Removal of the "Smart Migration" menu item.
- `worker/routes/migration.ts`: Backend logic refinement for immediate data activation.
