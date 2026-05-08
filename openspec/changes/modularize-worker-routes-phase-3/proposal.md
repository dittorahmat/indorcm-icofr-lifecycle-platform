## Why

The `worker/user-routes.ts` file has exceeded 3,400 lines and contains over 100 route handlers, creating a massive monolith that causes IDE performance issues, increases cognitive load, and makes the backend difficult to maintain. This change will continue the modularization effort by extracting the core RCM, BPM, and Scoping domains into dedicated route modules.

Additionally, this change will implement an "Unsaved Changes Warning" in the frontend to prevent data loss during edits, ensuring compliance with user experience standards for critical financial data entry.

## What Changes

- **Backend Modularization**:
  - Extract `/api/rcm/*` and `/api/controls/*` to `worker/routes/rcm.ts`.
  - Extract `/api/bpm/*` (Diagrams & Processes) to `worker/routes/bpm.ts`.
  - Extract `/api/simulations/*` and `/api/gl-snapshots/*` to `worker/routes/scoping.ts`.
  - Extract `/api/deficiencies/*` and `/api/actionplans/*` to `worker/routes/remediation.ts`.
  - Extract `/api/user/*`, `/api/settings`, and `/api/dev/*` to `worker/routes/users.ts`.
  - Update `worker/app.ts` to mount these new modules.
- **Unsaved Changes Warning**: Implement a global guard that detects unsaved changes in forms and prompts the user before navigation or tab closure.
- **Infrastructure**: Generate and run Drizzle migrations to support any underlying schema refinements required by the modularization or new features.
- **Localization**: Update `@src/i18n/` to support new UI strings for the unsaved changes warning and notification system.
- **UI/UX**: 
  - Add a Notification Bell to the header for system alerts.
  - Ensure all new features are integrated into the sidebar menu where appropriate.
- **Quality Gates**: Execute full type checking, linting, and build verification to ensure zero regressions.

## Capabilities

### New Capabilities
- `unsaved-changes-guard`: Detects dirty state in forms and prevents accidental navigation loss.
- `modular-backend-architecture`: Establishes the full domain-driven routing structure for the Cloudflare Worker.

### Modified Capabilities
- `remediation-tracking`: Refined backend routing for deficiencies and action plans.
- `csa-management`: Minor routing updates to align with modular structure.

## Impact

- `worker/user-routes.ts`: Size reduction from >3400 lines to <300 lines (only registration/legacy).
- `worker/app.ts`: Updated with new `app.route()` registrations.
- `src/components/`: New `UnsavedChangesGuard` component and UI enhancements.
- `src/i18n/`: New localization keys.
- `worker/db/schema.ts`: Potential refinements for Drizzle migrations.
