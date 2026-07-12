## 1. Localization Strings

- [x] 1.1 Add delete confirmation translations to `locales/en/scoping.json` (title, description, confirm, cancel keys for simulations and snapshots)
- [x] 1.2 Add delete confirmation translations to `locales/id/scoping.json` (title, description, confirm, cancel keys for simulations and snapshots)

## 2. ScopingPage AlertDialog Integration

- [x] 2.1 Import `AlertDialog` related subcomponents from `@/components/ui/alert-dialog` into `ScopingPage.tsx`
- [x] 2.2 Add localized state variables `deleteSimId` and `deleteSnapId` in `ScopingPage` component
- [x] 2.3 Render Simulation `<AlertDialog>` in `ScopingPage` using `deleteSimId` state and `mutations.deleteSim.mutate`
- [x] 2.4 Render Snapshot `<AlertDialog>` in `ScopingPage` using `deleteSnapId` state and `mutations.deleteSnap.mutate`

## 3. Connect Tables to Confirmation States

- [x] 3.1 Pass `setDeleteSimId` state setter as `onDelete` to `SimulationListTable` in `ScopingPage.tsx`
- [x] 3.2 Pass `setDeleteSnapId` state setter as `onDelete` to `GLSourceTable` in `ScopingPage.tsx`
- [x] 3.3 Verify confirmation modal shows on clicking trash icon in Simulations list
- [x] 3.4 Verify confirmation modal shows on clicking trash icon in Master GL (snapshots) list

## 4. Quality & Compliance Auditing

- [x] 4.1 Run type checks: `npm run type-check` to verify code compiling and import safety
- [x] 4.2 Run lint: `npm run lint` to verify coding conventions
- [x] 4.3 Run build: `npm run build` to verify system compatibility
