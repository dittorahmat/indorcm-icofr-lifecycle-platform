## 1. Type and Schema Updates

- [x] 1.1 Update `shared/types.ts`: Change `assignedDepartmentId: string` to `assignedDepartmentIds: string[]` in `GLRow` and `SignificantAccount`.
- [x] 1.2 Update `worker/db/schema.ts`: Ensure the `simulations` table's `significant_accounts` JSONB column and related fields support array values.
- [x] 1.3 Generate and run Drizzle migration: `npx drizzle-kit generate` and apply the migration.

## 2. Frontend Component Refactoring

- [x] 2.1 Refactor `src/components/scoping/GLDataGrid.tsx`: Replace `DepartmentPicker` with `MultiSelect` in the `departmentOwner` column.
- [x] 2.2 Update `GLDataGrid` props and column definitions to handle arrays of department IDs.
- [x] 2.3 Modify `handleExportExcel` in `GLDataGrid.tsx` to correctly represent multiple departments in the export.

## 3. Page Logic and Saving

- [x] 3.1 Fix `src/pages/scoping/ScopingPage.tsx`: Define or update the logic for `onAssignDepartment` to handle multiple department IDs.
- [x] 3.2 Update `updateSimMutation` in `ScopingPage.tsx` to include the `significantAccounts` with updated department arrays.
- [x] 3.3 Ensure the `isDirty` check in `ScopingPage.tsx` correctly accounts for changes in department assignments.

## 4. Localization and UX

- [x] 4.1 Update `src/i18n/`: Add or update strings in `scoping.json` (or relevant locale files) for multi-select labels and placeholders.
- [x] 4.2 Verify that the `UnsavedChangesDialog` correctly triggers when department assignments are modified.
- [x] 4.3 Final validation: Test the full flow—assigning multiple departments, saving draft, reloading, and ensuring the assignments persist.
