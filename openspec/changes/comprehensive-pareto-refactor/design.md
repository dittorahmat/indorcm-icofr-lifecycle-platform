## Context

The IndoGRC Pro application has evolved rapidly, resulting in some technical debt and UX inconsistencies. Specifically, types are duplicated between `shared/types.ts` and the Drizzle schema, worker routes contain too much business logic, and complex operations lack transactional safety. Additionally, user feedback indicates a need for localization and better data loss prevention (unsaved changes warnings).

## Goals / Non-Goals

**Goals:**
- Eliminate type duplication using Drizzle Type Inference.
- Refactor complex worker routes into a service layer with transaction support.
- Implement a robust "Unsaved Changes" warning system for editors.
- Establish a scalable localization (i18n) framework.
- Integrate a centralized notification system with a global UI bell.

**Non-Goals:**
- Full rewriting of all worker routes (only target "fat" or complex ones like Scoping Carry Forward).
- Implementing complex notification delivery (e.g., Email/SMS) - focus on in-app notifications.

## Decisions

### 1. Drizzle Type Inference
**Decision**: Migrate `shared/types.ts` to use Drizzle's `$inferSelect` and `$inferInsert` directly from the schema.
**Rationale**: This ensures that any schema change is automatically reflected in the frontend types, preventing runtime desynchronization bugs.
**Alternatives**: Manual interface maintenance (current state - high maintenance) or generating types from OpenAPI (requires extra build steps).

### 2. Service Layer with Transaction Support
**Decision**: Introduce a `worker/services/` directory. Complex operations like "Carry Forward" will be encapsulated in services that accept a database client (allowing for transaction injection).
**Rationale**: Improves separation of concerns (SOLID) and ensures atomicity for multi-step operations.
**Implementation**: `db.transaction(async (tx) => { await scopingService.carryForward(tx, ...); })`.

### 3. Localization Strategy (i18n)
**Decision**: Use `react-i18next` with a JSON-based translation structure in `src/i18n/locales/`.
**Rationale**: Industry standard for React apps; supports namespaces and dynamic loading.

### 4. Unsaved Changes Hook
**Decision**: Implement a `useUnsavedChanges` hook utilizing React Router's `useBlocker` for internal navigation and the `beforeunload` event for external navigation.
**Rationale**: Provides a consistent UX for both browser-level and SPA-level navigation.

### 5. Notification UI
**Decision**: Add a `NotificationBell` component to the `RootLayout` header using Shadcn/UI `Popover` and `ScrollArea`.
**Rationale**: Minimally invasive UI that provides high visibility for system alerts.

## Risks / Trade-offs

- **[Risk] Wide-scale type changes breaking UI components** → **Mitigation**: Perform the type refactor in stages and rely on `tsc` to identify all affected sites.
- **[Risk] Transaction overhead in serverless environment** → **Mitigation**: Keep transactions short-lived and only use them for critical data integrity operations.
- **[Risk] Missing translations for new features** → **Mitigation**: Establish a "fallback to English" policy and use a `t()` wrapper that logs missing keys.
