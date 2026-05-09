## Context

The current API codebase suffers from missing routes (`/api/bpm-diagrams/by-gl`) and incomplete business logic after a partial refactoring of the monolithic `user-routes.ts`. This design restores core functionality, enhances it with required features (i18n, unsaved changes guard), and fixes code smells following clean code principles.

## Goals / Non-Goals

**Goals:**
- Resolve 404 errors for BPM and CSA endpoints.
- Restore CSA Forensic/PDF Logic.
- Implement i18n support and UI enhancements (notification bell).
- Refactor worker routes for better modularity.

**Non-Goals:**
- Full-scale architecture rewrite (focus is on modularity and functional restoration).
- Changing business logic requirements beyond what was established in original codebase.

## Decisions

- **Modularity:** Move discovered logic from `user-routes.ts` (retrieved from commit `43d633c8`) into `worker/routes/bpm.ts` and `worker/routes/csa.ts`.
- **Refactoring:** Apply SOLID/DRY principles by moving shared utilities out of route handlers into `worker/lib/`.
- **Forensic Data:** Keep forensic metadata in JSONB columns (consistent with current schema).

## Risks / Trade-offs

- [Risk] Migration failure → Mitigation: Perform `drizzle-kit push` before deploying changes.
- [Risk] Unsaved changes guard conflicts with existing form logic → Mitigation: Integrate as a HOC or Hook to maintain independence.
