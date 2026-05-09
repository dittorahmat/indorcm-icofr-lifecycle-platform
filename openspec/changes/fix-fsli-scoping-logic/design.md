## Context
The current scoping implementation (`ScopingPage.tsx`) has a technical debt where FSLI-level qualitative assessments are incorrectly propagating to all child GL accounts. This is due to a mismatch between FSLI-grouped UI controls and flat GL-level data processing.

## Goals / Non-Goals

**Goals:**
- Correctly filter GL accounts based on FSLI-group signficance logic.
- Implement a cleanup script for database-level removal of incorrectly significant accounts.
- Integrate UI improvements (Notification bell, sidebar update) to enhance usability and consistency.

**Non-Goals:**
- A full redesign of the materiality calculation algorithm beyond the scope of this fix.

## Decisions

- **Logic Refactoring**: Filter GL accounts by FSLI significance first, ensuring that if an FSLI is marked significant at the group level, only valid children accounts are marked significant.
- **Cleanup Strategy**: Create a TypeScript maintenance script that runs once to migrate existing data in the `simulations` table.
- **UI Enhancements**: Add a lightweight notification bell and update the `AppLayout` to link to the updated scoping and new features.

## Risks / Trade-offs

- [Risk] Data corruption if migration script is improperly configured → Mitigation: Pre-migration database dump/backup.
- [Risk] Frontend caching issues → Mitigation: Clear React Query cache, enforce cache invalidation on deployment.
