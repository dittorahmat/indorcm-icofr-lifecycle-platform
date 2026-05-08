## Why

The `CSATabContent` component currently suffers from a deadlock in its read-only logic, which prevents users from verifying controls or uploading evidence for any assessment that has already been saved as a draft. This critical bug halts the ICOFR execution lifecycle. Additionally, the user requested UI refinements including a notification bell, localization sync, and enforcement of the unsaved changes guard to align with project standards.

## What Changes

- **Fix CSA Deadlock**: Refactor `isDirty` and `isReadOnly` state logic in `CSATabContent.tsx` to allow editing of drafts and existing records.
- **Evidence Upload UX**: Provide visual feedback when the upload button is disabled and add a loading state during the upload process.
- **Notification Bell**: Implement a notification bell in the sidebar to surface pending tasks or system alerts.
- **Localization Sync**: Update `@src/i18n/` to ensure all new CSA and Sidebar strings are properly localized in both Indonesian and English.
- **Unsaved Changes Enforcement**: Ensure `CSATabContent` and other modified components strictly follow the `unsaved-changes-guard` spec.
- **Database Schema Sync**: Run Drizzle migrations (`npx drizzle-kit push`) to ensure the local development environment is synced with the latest schema definitions.
- **Quality Assurance**: Perform full type-checking, linting, and a production build to identify and fix any regressions.

## Capabilities

### New Capabilities
- None (All changes map to existing architectural modules).

### Modified Capabilities
- `granular-csa-verification`: Update logic to support non-blocking editing of existing draft records.
- `compliance-notification-system`: Add the UI implementation for the notification bell in the sidebar.
- `unsaved-changes-guard`: Align `CSATabContent` implementation with the standardized guard behavior.

## Impact

- `src/components/bpm/CSATabContent.tsx`: Main logic and UI fix.
- `src/components/layout/Sidebar.tsx` (or equivalent): Addition of the notification bell.
- `src/i18n/`: Translation file updates.
- Database: Potential schema sync via Drizzle.
- Build Pipeline: Verification of project integrity via `tsc`, `lint`, and `vite build`.
