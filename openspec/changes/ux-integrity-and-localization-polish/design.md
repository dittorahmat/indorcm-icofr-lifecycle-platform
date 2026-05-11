## Context

IndoGRC Pro currently has fragmented localization and lacks a unified database synchronization strategy for production. Additionally, while initial hooks for unsaved changes exist, they are not consistently applied, leading to data loss risks. The notification system is also mostly backend-only or notification-list-based, lacking a persistent UI anchor.

## Goals / Non-Goals

**Goals:**
- Zero data loss for Scoping and BPM Editor through robust navigation guards.
- 100% localization coverage for primary user workflows.
- Fully synced production database schema via Drizzle migrations.
- Centralized UI for real-time compliance notifications.

**Non-Goals:**
- Real-time collaboration (multi-user editing).
- Advanced i18n features like pluralization or RTL support (out of scope for SK-5 baseline).
- Offline support.

## Decisions

### 1. Database Synchronization (Drizzle)
- **Decision**: Use `npx drizzle-kit push` for development environments and generated migration files for production-like environments.
- **Rationale**: `push` is faster for iteration, while generated migrations provide an auditable history of schema changes.

### 2. Localization Strategy (i18next)
- **Decision**: Centralize all translation files in `src/i18n/locales/` and use the `useTranslation` hook.
- **Rationale**: Industry standard for React, supports lazy loading and easy maintenance.
- **Alternatives**: Custom localization context (rejected for lack of ecosystem support/features).

### 3. Navigation Guard (React Router useBlocker)
- **Decision**: Leverage the existing `UnsavedChangesContext` and `UnsavedChangesGuard` component. Wire it into the main `AppLayout` or `Router`.
- **Rationale**: `useBlocker` is the idiomatic way to handle navigation confirmation in React Router v6.
- **Trigger**: Any change to Materiality Simulation inputs or BPM Diagram nodes must set `isDirty: true`.

### 4. Notification Bell UI
- **Decision**: Implement a `NotificationBell` component in the `Header` that queries the `/api/notifications` endpoint.
- **Rationale**: Minimal effort with high impact on situational awareness.
- **Alternatives**: WebSocket-based push (rejected as overkill for current needs/YAGNI).

## Risks / Trade-offs

- **[Risk]** → Migration Failure. **[Mitigation]** → Always back up database before `drizzle-kit push` and verify `check-simulations.ts` script passes.
- **[Risk]** → `useBlocker` limitations with external links. **[Mitigation]** → Use `window.onbeforeunload` for external navigation.
- **[Risk]** → Localization missing keys. **[Mitigation]** → Use `i18next-parser` or manual sweep to ensure all `t()` calls have corresponding entries.
