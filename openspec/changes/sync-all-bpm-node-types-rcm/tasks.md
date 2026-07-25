## 1. Backend Service Refactoring

- [x] 1.1 Refactor `worker/services/bpm-service.ts` to allow all node types except `'start'`, `'end'`, `'reference'`, and `'swimlane'` in `hydrateDiagramNodes`.
- [x] 1.2 Refactor `worker/services/bpm-service.ts` to allow all node types except `'start'`, `'end'`, `'reference'`, and `'swimlane'` in `syncRisksAndControlsFromNodes` (both standard and legacy checks).

## 2. Backfill Script Creation

- [x] 2.1 Create `scripts/backfill-bpm-custom-nodes.ts` to fetch all diagram records and invoke diagram update/sync logic to populate RCM tables.

## 3. Verification & CI/CD Checks

- [x] 3.1 Verify that saving diagrams with custom nodes (e.g. Hexagon `preparation` or Cylinder `data-media`) successfully syncs RCMs and Controls to the database.
- [x] 3.2 Run the backfill script and verify that orphaned custom nodes are repaired and visible in TLC, ELC, and ITGC.
- [x] 3.3 Run localization audit on any modified/new files.
- [x] 3.4 Run `npm run type-check` to ensure type safety.
- [x] 3.5 Run `npm run lint` and `npm run build` to verify project compilation.
