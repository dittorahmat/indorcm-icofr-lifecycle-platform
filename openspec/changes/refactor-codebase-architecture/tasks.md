## 1. Database Connections & Types Refactoring

- [x] 1.1 Update `worker/db/index.ts` to dynamically switch drivers between `postgres.js` (TCP) and `@neondatabase/serverless` (WebSocket Pool/HTTP) depending on runtime.
- [x] 1.2 Unify the `DrizzleDb` type to use the generic `PgDatabase` interface in `worker/db/index.ts`.
- [x] 1.3 Update references of `DrizzleDb` imports in `worker/services` to ensure driver agnosticism compiles cleanly.

## 2. Database Transactions Implementation

- [x] 2.1 Wrap sequential operations in `BpmService.ts` (`updateDiagram`) in a `db.transaction` block.
- [x] 2.2 Wrap sequential operations in `ScopingService.ts` (`carryForward`) in a `db.transaction` block.
- [x] 2.3 Wrap delete operations in `ControlService.ts` (`delete`) in a `db.transaction` block.

## 3. Frontend Logger (Error Reporter) Queue Batching

- [x] 3.1 Refactor the `console.warn` and `console.error` wrappers in `errorReporter.ts` to route logs to the deduplication queue.
- [x] 3.2 Ensure the console wrappers do not make immediate `/api/client-errors` fetch requests.

## 4. Frontend Component Bloat & Accessibility Fixes

- [x] 4.1 Extract complex state and derived properties from `BPMPage.tsx` into a new custom hook `useBPMPage.ts`.
- [x] 4.2 Split `BPMPage` into smaller modular child components or panels.
- [x] 4.3 Add a visually hidden `<DialogTitle>` inside Radix `Dialog` blocks in `BPMPage.tsx` to fix accessibility warnings.

## 5. Hook File Renaming & Constants Cleanup

- [x] 5.1 Rename hook files in `src/hooks/` (e.g., `useCSA.ts`, `useTOD.ts`) to follow kebab-case (`use-csa.ts`, `use-tod.ts`).
- [x] 5.2 Extract local time constants (millisecond equivalents of days, weeks, months) from `compliance-utils.ts` into a module-level constant or `constants.ts`.

## 6. Verification and Testing

- [x] 6.1 Run `npm run type-check` to ensure no TypeScript compilation errors.
- [x] 6.2 Run `npm run lint` to verify ESLint compliance.
- [x] 6.3 Run `npm test` to verify all unit tests pass without errors or console warnings.
