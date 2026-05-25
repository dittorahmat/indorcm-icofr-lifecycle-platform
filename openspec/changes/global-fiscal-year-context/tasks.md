## 1. Global State Infrastructure

- [x] 1.1 Create `src/store/useFiscalYearStore.ts` using Zustand.
- [x] 1.2 Implement URL synchronization logic (syncing store with `?year=` parameter).
- [x] 1.3 Ensure `i18n` localization for all global time-related strings.

## 2. Main Header Integration

- [x] 2.1 Add the Global Year Selector dropdown to `src/components/layout/MainHeader.tsx`.
- [x] 2.2 Wire the selector to `useUnsavedChanges` guard to prevent data loss when switching years during active edits.
- [x] 2.3 Integrate Notification Bell alerts for successful global year changes or migration events.

## 3. Migration Backend Realization

- [x] 3.1 Create `worker/routes/migration.ts` and register it in `worker/app.ts`.
- [x] 3.2 Implement the **POST `/api/migration/finalize`** logic (Atomic insertion of GL, RCM, and Control data).
- [x] 3.3 Generate and run Drizzle migrations (`npx drizzle-kit push`) to support any production schema changes.
- [x] 3.4 Implement automated generation of `Approved` Materiality Simulations upon successful TB import.

## 4. Component Refactoring (Clean Code & SOLID)

- [x] 4.1 Refactor `ScopingPage.tsx` to subscribe to the global store and remove local state/dropdowns.
- [x] 4.2 Refactor `BPMPage.tsx` to subscribe to the global store and remove local state/dropdowns.
- [x] 4.3 Ensure all API calls in operational pages include the `year` parameter from the global store.

## 5. Verification & Quality Assurance (TDD)

- [x] 5.1 Create unit tests for the Migration Engine and Fiscal Year Store.
- [x] 5.2 Validate end-to-end data persistence (Migration -> Scoping/RCM visibility).
- [x] 5.3 Run global `type-check`, `lint`, and `build` commands to ensure zero errors.
