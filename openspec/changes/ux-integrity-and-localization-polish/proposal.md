## Why

To ensure the production readiness of IndoGRC Pro, we need to finalize critical user experience and data integrity features. This includes reinforcing data safety with unsaved changes warnings (preventing data loss), finalizing localization for regulatory compliance, ensuring database schema consistency through migrations, and improving user situational awareness via a centralized notification bell.

## What Changes

- **Database Integrity**: Generation and execution of Drizzle migrations to ensure the backend schema is fully synced with current requirements.
- **Localization Completion**: Comprehensive sweep and implementation of i18n keys across all modules (Scoping, RCM, BPM, CSA) to support bilingual regulatory reporting.
- **Unsaved Changes Guard**: Implementation of route-level and browser-level warnings when a user attempts to leave a page with unsaved progress, specifically in the Scoping and BPM Editor modules.
- **Notification Center**: Introduction of a persistent notification bell in the global header to surface system alerts, approval requests, and compliance reminders.
- **Sidebar Integration**: Updates to the application sidebar to ensure all finalized modules are correctly linked and localized.

## Capabilities

### New Capabilities
- `i18n-framework`: Standardized approach for managing translation keys and runtime language switching across the platform.

### Modified Capabilities
- `unsaved-changes-guard`: Requirement updated to include specific integration for Scoping Page and BPM Editor with custom dirty-state detection.
- `compliance-notification-system`: Requirement modified to include the "Notification Bell" UI component and real-time alert count synchronization.

## Impact

- **Database**: `worker/db/schema.ts`, `drizzle.config.ts`.
- **Backend**: `worker/app.ts` (Notification endpoints).
- **Frontend**: `src/i18n/`, `src/components/layout/AppLayout.tsx` (Sidebar/Header), `src/pages/scoping/ScopingPage.tsx`, `src/components/rcm/BPMEditor.tsx`.
- **Shared**: `shared/types.ts` (Notification entity types).
