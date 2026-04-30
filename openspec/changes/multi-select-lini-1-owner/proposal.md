## Why

Currently, the "Lini 1 Owner" assignment in the GL Scoping worksheet only allows a single department to be selected, which does not reflect the reality of државної/SOE processes where an account may involve multiple departments. Additionally, there is a bug where department assignments are not being saved because of a missing mutation variable (`assignDeptMutation`), and the saving flow is inconsistent with the rest of the worksheet.

## What Changes

- **Multi-select for Lini 1 Owner**: Replace the single-select `DepartmentPicker` with a multi-select component in the `GLDataGrid`.
- **Database Schema Update**: Modify the `significant_accounts` JSONB structure and potentially the `gl_rows` table (via migration) to support an array of department IDs.
- **Fixed Saving Logic**: Implement a robust saving mechanism for Lini 1 Owner assignments, integrating it into the "Save Draft" workflow of the `ScopingPage`.
- **Localization**: Add translations for new labels and messages in `src/i18n/scoping`.
- **Unsaved Changes Integration**: Ensure that changing department assignments marks the worksheet as "dirty," triggering the unsaved changes warning.

## Capabilities

### New Capabilities
- `multi-department-assignment`: Ability to assign multiple departments to a single account in the scoping matrix.

### Modified Capabilities
- `gl-integration`: Requirements modified to support multiple department owners per account.

## Impact

- `shared/types.ts`: Update `GLRow` and `SignificantAccount` types to use `assignedDepartmentIds: string[]`.
- `worker/db/schema.ts`: Ensure the database schema aligns with the new multi-select data structure.
- `src/components/scoping/GLDataGrid.tsx`: Refactor the owner column to use a multi-select component.
- `src/pages/scoping/ScopingPage.tsx`: Fix the `onAssignDepartment` handler and define the missing mutation.
- `src/i18n/`: Update localization files.
