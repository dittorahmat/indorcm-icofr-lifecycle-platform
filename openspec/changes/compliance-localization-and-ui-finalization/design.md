## Context

IndoGRC Pro is approaching a production-ready state. However, the UI still contains mixed language strings (Indonesian and English), lacks a unified real-time notification interface, and has incomplete implementations of data-loss prevention (unsaved changes). The database schema also needs synchronization to ensure all local and worker-side models are aligned.

## Goals / Non-Goals

**Goals:**
- **Zero-String Hardcoding**: All user-facing text moved to `i18n` JSON files.
- **Unified Navigation Guard**: Standardized usage of `useUnsavedChanges` hook and `UnsavedChangesDialog` on all critical pages.
- **Real-time Awareness**: Functional notification bell in the header that accurately reflects the state of the compliance notification system.
- **Structural Integrity**: Synchronized Drizzle schema and verified system build (TSC/Lint).

**Non-Goals:**
- New business logic features (e.g., new audit procedures).
- Overhaul of existing styling (Shadcn/UI components remain the base).
- Performance optimization of the notification system backend.

## Decisions

### 1. Localization Strategy
- **Decision**: Centralize all missing strings into existing `src/i18n/locales/[lang]/*.json` files.
- **Rationale**: Keeps the project consistent with the `react-i18next` pattern already established.
- **Alternatives**: Using localized components (too verbose) or inline conditional rendering (unmaintainable).

### 2. Unsaved Changes Guard Pattern
- **Decision**: Use the `useBlocker` pattern from `react-router-dom` v6.7+ within the `useUnsavedChanges` hook.
- **Rationale**: This is the recommended way to handle route transitions in modern React Router and matches the archived project standard.
- **Integration**: Apply to `ScopingPage`, `BPMPage`, `RCMTLCPage`, `RCMELCPage`, and `CSATabContent`.

### 3. Notification Bell Integration
- **Decision**: Integrate `NotificationBell` component into `AppLayout` header, connected to the existing `NotificationCenter` logic.
- **Rationale**: Provides a consistent entry point for user alerts across the application.

### 4. Database Schema Sync
- **Decision**: Use `npx drizzle-kit push` for rapid schema synchronization during this refinement phase.
- **Rationale**: Since we are in an iterative development cycle before final production freeze, `push` is faster than sequential migrations for non-breaking schema refinements.

## Risks / Trade-offs

- [Risk] → Localization might miss deep-nested strings in complex modals.
  - [Mitigation] → Perform a manual "UI Sweep" and use grep to find remaining string literals.
- [Risk] → `useBlocker` might conflict with certain browser extensions or aggressive refresh behavior.
  - [Mitigation] → Supplement with `beforeunload` global listener for browser-level events.
- [Risk] → Database `push` could cause data loss if fields are renamed.
  - [Mitigation] → Carefully review schema diff before confirming the push.
