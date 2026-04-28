## Context

The `BPMEditor` currently relies on `new Date().getFullYear()` to determine if a diagram should be read-only ("Locked"). This is problematic during transitional audit periods (e.g., Q1 2026) when users need to modify documentation for the previous fiscal year (2025). Additionally, bugs in the backend creation and update handlers cause `year` and `subProcess` metadata to be dropped, resulting in diagrams that are effectively "orphaned" from the filtered lists.

## Goals / Non-Goals

**Goals:**
- Decouple diagram locking from the current calendar year.
- Ensure 100% persistence of `year` and `subProcess` metadata in the database.
- Integrate `UnsavedChangesGuard` to prevent data loss.
- Standardize localization for all BPM Editor labels.

**Non-Goals:**
- Implementing a multi-version branching system for diagrams.
- Refactoring the core React Flow node/edge structure.

## Decisions

### 1. Working Year Prop Injection
**Decision**: `BPMEditor` will receive a mandatory `workingYear` prop from its parent (`BPMPage.tsx`).
- **Rationale**: The parent already manages `viewYear` (synced with URL params). Passing this down ensures the editor's "lock" state aligns with the user's navigational context.
- **Alternatives**: Using a Global Context (Zustand) was considered, but prop drilling is sufficient for this shallow hierarchy and more explicit.

### 2. Context-Aware Locking Logic
**Decision**: `isLocked` will evaluate `(diagram.year < workingYear) || settings.isPeriodLocked`.
- **Rationale**: This allows editing of previous-year data as long as the user has explicitly selected that year to work on AND the period hasn't been officially "closed" via settings.

### 3. Backend Schema Enforcement
**Decision**: Update `worker/user-routes.ts` to include `year` and `subProcess` in the JSON validation for both `POST` and `PUT`.
- **Rationale**: Prevents `NULL` values in the database that break the frontend's year-based filtering.

### 4. UX Safety & Localization
**Decision**: Integrate `useUnsavedChanges` hook and replace all hardcoded strings with `t()` calls from the `bpm` namespace.
- **Rationale**: Consistency with other modules (RCM, Scoping) and support for Indonesian/English requirements.

## Risks / Trade-offs

- **[Risk]**: User might accidentally edit a diagram from an old period by switching the `viewYear` back.
- **[Mitigation]**: Implement a strong visual indicator ("LOCKED - Audit Baseline") and ensure the `isPeriodLocked` flag is used as the ultimate authority for finalized years.
- **[Risk]**: NULL values in existing database records.
- **[Mitigation]**: Create a one-time Drizzle migration/cleanup script to assign current years to orphaned diagrams.
