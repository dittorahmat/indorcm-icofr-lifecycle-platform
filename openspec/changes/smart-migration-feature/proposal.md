## Why

Currently, the application is optimized for greenfield BUMNs starting ICOFR from scratch. Brownfield BUMN groups (holding companies and their subsidiaries) that already have ongoing ICOFR processes face significant friction when migrating fragmented data from multiple entities. This change introduces an AI-assisted "Smart Migration" feature to ingest existing RCM and TB data across multiple subsidiaries, using `entityCode` to reconstruct a unified group-wide ICOFR baseline.

## What Changes

- **Multi-Entity Staging Area**: A workspace to upload and review data from the parent company and its subsidiaries simultaneously.
- **AI-Assisted Entity Mapping**: Automatic detection of `entityCode` from Excel rows to route data to the correct subsidiary or branch.
- **AI-Assisted Normalization**: Automatic mapping of free-text Excel fields from different subsidiaries to a single corporate standard.
- **Bottom-Up Hierarchy Reconstruction**: Automatic creation of Business Processes, Risks, and Accounts for each entity based on the uploaded data.
- **Group-Wide Financial-Control Cross-Check**: Automated validation to ensure all significant accounts across the entire BUMN group (parent and subsidiaries) are covered by appropriate controls.
- **One-Click Corporate Baselining**: A bulk approval workflow for the Holding/CFO to establish a legal baseline for the entire group's historical data.

## Capabilities

### New Capabilities
- `smart-migration`: The core engine and UI for ingesting, normalizing, and baselining brownfield ICOFR data from external sources.

### Modified Capabilities
- `gl-integration`: Requirements updated to support automated mapping of local GLs to Standar FSLI BUMN (SK-164) during migration.
- `regulatory-lifecycle-tracking`: Requirements updated to include "Migration Baseline" as a valid legal entry point in the audit trail.

## Impact

- **Database**: Addition of staging storage, metadata flags (`isMigrated`, `aiGuessedFields`), and required Drizzle schema migrations.
- **Frontend**: New "Migration" route and Staging Table component.
- **Navigation & Safety**: Integration into the Sidebar menu, addition of `useUnsavedChanges` guard to prevent accidental data loss during staging review, and Notification Bell alerts upon successful migration.
- **Localization**: Full i18n support for all new migration UI elements in both English and Indonesian.
- **Backend API**: New endpoints for AI normalization, bottom-up reconstruction, and bulk approval.
- **Compliance**: Establishment of a documented "System Baseline" for historical data, satisfying SK-5/2024 auditing requirements.
