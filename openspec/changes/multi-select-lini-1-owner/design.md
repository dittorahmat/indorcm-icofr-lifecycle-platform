## Context

The current single-select department assignment in `GLDataGrid` is insufficient for accounts shared across multiple departments. The implementation is also currently broken due to a missing mutation in `ScopingPage.tsx`.

## Goals / Non-Goals

**Goals:**
- Enable multi-select for Lini 1 Owner in the Scoping worksheet.
- Fix the broken saving logic for department assignments.
- Update the database schema to support multiple department IDs per account.
- Ensure consistency with localization and unsaved changes patterns.

**Non-Goals:**
- Implementing multi-select for other fields not requested.
- Changing the RCM or BPM data structures beyond scoping assignments.

## Decisions

### 1. Data Structure Update
- **Decision**: Update `shared/types.ts` to replace `assignedDepartmentId: string` with `assignedDepartmentIds: string[]` in `GLRow` and `SignificantAccount`.
- **Rationale**: Arrays provide a clean, type-safe way to represent multiple IDs.
- **Alternatives**: Using a comma-separated string (harder to manage/validate) or a separate relational table (overkill for simple scoping assignments).

### 2. Database Migration
- **Decision**: Use `npx drizzle-kit generate` and `npx drizzle-kit migrate` (via worker scripts) to update the `simulations` table's `significant_accounts` JSONB column and potentially add a helper column to `gl_rows` if needed for tracking.
- **Rationale**: Drizzle is the project's established ORM.

### 3. Component Choice
- **Decision**: Use the existing `MultiSelect` component from `src/components/ui/multi-select.tsx` instead of `DepartmentPicker`.
- **Rationale**: Reuses established patterns and provides a superior UX for multiple choices.

### 4. Saving Flow Integration
- **Decision**: Define a new `updateDepartmentAssignments` logic within the `updateSimMutation` in `ScopingPage.tsx`. 
- **Rationale**: This centralizes the saving process into the "Save Draft" button, reducing API calls and ensuring data consistency.

## Risks / Trade-offs

- **[Risk]** Data Loss during Migration → **Mitigation**: Ensure migrations handle existing single-string values by converting them to single-element arrays.
- **[Risk]** Large Number of Departments → **Mitigation**: The `MultiSelect` component includes a search filter to handle large lists efficiently.
