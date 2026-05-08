## 1. Backend: Domain Extraction (RCM & BPM)

- [x] 1.1 Create `worker/routes/rcm.ts` and migrate `/api/rcm/*` and `/api/controls/*` routes.
- [x] 1.2 Create `worker/routes/bpm.ts` and migrate all BPM Diagram and Process routes.
- [x] 1.3 Verify imports and type safety in new RCM/BPM modules.
- [x] 1.4 Register RCM and BPM modules in `worker/app.ts`.

## 2. Backend: Domain Extraction (Scoping & Remediation)

- [x] 2.1 Create `worker/routes/scoping.ts` and migrate Simulation and GL Snapshot routes.
- [x] 2.2 Create `worker/routes/remediation.ts` and migrate Deficiency and Action Plan routes.
- [x] 2.3 Verify imports and type safety in new Scoping/Remediation modules.
- [x] 2.4 Register Scoping and Remediation modules in `worker/app.ts`.

## 3. Backend: User & Infrastructure Cleanup

- [x] 3.1 Create `worker/routes/users.ts` and migrate User and Dev routes.
- [x] 3.2 Create `worker/routes/infrastructure.ts` and migrate Application, Vendor, and SOC routes.
- [x] 3.3 Create `worker/routes/reporting.ts` and migrate Export and Aggregation routes.
- [x] 3.4 Create `worker/routes/transactions.ts` and migrate Transaction Isolation routes.
- [x] 3.5 Register all remaining modules in `worker/app.ts`.
- [x] 3.6 Clean up `worker/user-routes.ts` leaving only registration logic if any, or delete if empty.

## 4. Frontend: Unsaved Changes Guard

- [x] 4.1 Create `UnsavedChangesContext` and `UnsavedChangesProvider` in `src/context/`.
- [x] 4.2 Implement `useUnsavedChanges` hook to manage dirty state registration.
- [x] 4.3 Add `UnsavedChangesGuard` component to the main App shell to intercept navigation.
- [x] 4.4 Add `window.onbeforeunload` listener for browser-level protection.
- [x] 4.5 Update i18n files (`@src/i18n/`) with warning messages in ID and EN.

## 5. UI/UX: Notification Bell & Sidebar

- [x] 5.1 Create `NotificationBell` component and integrate into the Header.
- [x] 5.2 Implement periodic refetching for notifications in `NotificationBell`.
- [x] 5.3 Ensure Sidebar menu items are correctly grouped and consistent with new modular domains.

## 6. Infrastructure & Quality Gates

- [x] 6.1 Generate Drizzle migrations if any schema changes were identified: `npx drizzle-kit generate`.
- [x] 6.2 Apply migrations to local DB: `npx drizzle-kit push`.
- [x] 6.3 Run full type check: `npm run typecheck` (or `tsc`).
- [x] 6.4 Run linter: `npm run lint`.
- [x] 6.5 Run full build: `npm run build`.
- [x] 6.6 Fix any remaining errors and verify all routes are functional.
