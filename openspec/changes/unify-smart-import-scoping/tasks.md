## 1. Modularization & Component Creation

- [x] 1.1 Create `src/components/scoping/SmartImportWizard.tsx` by porting logic from `MigrationPage.tsx`.
- [x] 1.2 Refactor the wizard to use the Shadcn `Dialog` component.
- [x] 1.3 Ensure all localized strings are updated for the new modal context.

## 2. Scoping Page Integration

- [x] 2.1 Update `ScopingPage.tsx` to include the `SmartImportWizard` component.
- [x] 2.2 Wire the "Upload GL" button to open the `SmartImportWizard`.
- [x] 2.3 Implement automatic data refresh on modal closure using `queryClient.invalidateQueries`.

## 3. Navigation & Route Cleanup

- [x] 3.1 Remove the `/rcm/migration` route from `src/main.tsx`.
- [x] 3.2 Remove the "Smart Migration" menu item from `src/components/app-sidebar.tsx`.
- [x] 3.3 Delete the redundant `src/pages/migration/MigrationPage.tsx` file and its components folder if no longer needed.

## 4. Backend Refinement

- [x] 4.1 Update `worker/routes/migration.ts` to ensure `isActive: true` is always set for imported snapshots.
- [x] 4.2 Validate that the migration engine generates all required production records (Simulations, Processes, Controls).

## 5. Verification & Compliance (Mandatory)

- [x] 5.1 Run `npm run type-check` and fix any import/type errors.
- [x] 5.2 Run `npm run lint` and `npm run build`.
- [x] 5.3 Perform a real end-to-end import on the Scoping page and verify data visibility.
