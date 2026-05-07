## Why

To ensure the IndoGRC Pro platform is production-ready and fully compliant with SK-5/2024 standards, several critical UI and infrastructure enhancements are required. These include finalization of the unsaved changes protection system (to prevent data loss during audit sessions), comprehensive localization of remaining hardcoded strings (to ensure user clarity), and UI refinements like a notification bell and sidebar organization. Additionally, database structural changes must be pushed to support ongoing feature development.

## What Changes

- **Localization Finalization**: Replace all remaining hardcoded UI strings (toasts, placeholders, labels) in `src/pages/` and `src/components/` with `i18n` translations.
- **Unsaved Changes Guard Implementation**: Complete the implementation of `useUnsavedChanges` and `UnsavedChangesDialog` across all high-stakes pages (Scoping, BPM, RCM, CSA) as per the archived project standards.
- **Notification Bell & Hub**: Add a global notification bell to the header and integrate it with the `compliance-notification-system` to alert users of pending tasks or approvals.
- **Sidebar & Menu Refinement**: Reorganize sidebar items to improve navigation flow and ensure all major modules (To-do List, CSA Reports, RCM Matrix) are easily accessible.
- **Drizzle Schema Synchronization**: Generate and execute database migrations (`drizzle-kit push`) to align the local/remote database with the current schema definitions.
- **Validation Audit**: Run comprehensive `type check`, `lint`, and `build` commands to ensure system integrity and fix any regression errors.

## Capabilities

### New Capabilities
- `ui-state-persistence-guard`: Refined ability to protect complex user input states from navigation loss.

### Modified Capabilities
- `compliance-notification-system`: Requirements expanded to include real-time UI notification bell integration.
- `unsaved-changes-guard`: Finalized implementation requirements for production use.
- `gl-integration`: Modified to include schema synchronization workflows.

## Impact

- `src/i18n/locales/`: Updates to `id/` and `en/` JSON files.
- `src/components/layout/AppLayout.tsx`: Integration of Notification Bell and Sidebar updates.
- `src/hooks/useUnsavedChanges.ts`: Refinement and broader application.
- `src/db/schema.ts`: Drizzle schema updates and migrations.
- `src/components/app-sidebar.tsx`: Navigation structure changes.
