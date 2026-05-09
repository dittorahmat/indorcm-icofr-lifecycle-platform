## Why

The IndoGRC Pro codebase currently faces technical debt that threatens its long-term stability and developer productivity. Key issues include redundant type definitions between the database and frontend, "fat" route handlers in the worker with complex business logic, and a lack of transactional integrity for multi-step operations. Additionally, the application requires UX and compliance polish, specifically around localization, unsaved changes protection, and a centralized notification system.

## What Changes

- **Single Source of Truth Types**: Replace manual interfaces in `shared/types.ts` with automatic Drizzle Type Inference (`$inferSelect`, `$inferInsert`) to eliminate desynchronization bugs.
- **Transactional Integrity**: Wrap complex, multi-table operations (e.g., Scoping "Carry Forward" logic) in database transactions to prevent data corruption.
- **Service Layer Abstraction**: Refactor worker route handlers to delegate business logic to a dedicated service layer, improving testability and separation of concerns.
- **Localization (i18n)**: Implement comprehensive localization support in `src/i18n/`, ensuring all UI text is internationalized and compliant with regional standards.
- **Unsaved Changes Protection**: Port and implement the navigation guard system (internal and external) to prevent accidental data loss in editors (Scoping, BPM).
- **Notification System**: Add a notification bell component to the global UI and ensure relevant lifecycle events trigger notifications.
- **Sidebar Menu Updates**: Refine the sidebar to improve navigation and accessibility for new modules.
- **Schema & Quality Automation**: Generate and apply Drizzle migrations via `npx drizzle-kit push` and establish a validation pipeline (type-check, lint, build) to ensure zero-regression delivery.

## Capabilities

### New Capabilities
- `multi-language-support`: System-wide support for multiple languages and regional compliance formatting.
- `centralized-notification-system`: A global UI and backend hook for managing and displaying system notifications.
- `unsaved-changes-guard`: Detection and warning system for unsaved changes during navigation.

### Modified Capabilities
- `scoping-management`: Requirements updated to include transactional integrity and data loss protection.
- `rcm-bpm-visualization`: Requirements updated to include unsaved changes warnings and localized labels.

## Impact

- `shared/types.ts`: Significant reduction in manual type declarations.
- `worker/db/schema.ts`: Addition of notification-related tables if needed (already exists in schema, but may need refinement).
- `worker/routes/`: Refactoring of handlers into services.
- `src/i18n/`: New configuration and locale files.
- `src/components/layout/`: Global sidebar and header updates.
- `src/hooks/`: New `useUnsavedChanges` and `useNotification` hooks.
