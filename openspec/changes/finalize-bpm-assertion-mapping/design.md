## Context

The ICOFR lifecycle requires aligning business processes with specific financial assertions. Currently, these assertions are managed individually per control in the RCM, leading to data duplication and potential inconsistency. This design introduces a centralized assertion mapping at the Account level within the BPM worksheet.

## Goals / Non-Goals

**Goals:**
- Provide a centralized UI in `BPMPage.tsx` for setting assertions per GL Account.
- Implement an inheritance mechanism where RCM controls default to these centralized assertions.
- Support manual overrides at the control level.
- Ensure compliance with SK-5 Table 8 descriptions through interactive UI elements.
- Maintain data consistency with a dedicated database table.
- Implement "unsaved changes" warning for the new assertion configuration.

**Non-Goals:**
- Automated extraction of assertions from external documents (AI-based).
- Changes to the materiality calculation logic itself (only consuming the FSLI/GL list).

## Decisions

### 1. New Database Table: `account_assertions`
- **Rationale**: Storing mapping in a dedicated table `(fsli_name, no_gl) -> assertions` avoids redundant data in the `bpm_processes` table and allows assertions to exist even if no specific sub-process is defined yet.
- **Alternatives**: Storing in `bpm_processes` (bad because one account has multiple sub-processes) or in a JSON column in `gl_rows` (bad because it's transient per snapshot).

### 2. Assertion Inheritance via Backend Join
- **Rationale**: The API `/api/rcm-matrix/tlc` will perform a `LEFT JOIN` on `account_assertions`.
- **Logic**: If `rcm_controls.assertionX` is null/empty, the API returns `account_assertions.assertionX`. This ensures the UI "sees" the inheritance without complex frontend logic.
- **Rationale**: Simplifies the frontend and ensures that even exported reports reflect the centralized mapping.

### 3. Tooltip-based Regulatory Descriptions
- **Rationale**: Using `Tooltip` from Shadcn/UI to display text from SK-5 Table 8. This keeps the table compact while providing expert context on demand.

### 4. Integration with `useUnsavedChanges`
- **Rationale**: Leverage the existing `useUnsavedChanges` hook (or equivalent `useBlocker`) to track the "dirty" state of the assertion dropdowns.

## Risks / Trade-offs

- **[Risk]** User confusion when changing a centralized assertion affects many RCM rows.
- **[Mitigation]** Clear UI labelling ("Source of Truth") and possibly a confirmation dialog when bulk-updating inherited values.
- **[Risk]** Manual overrides being overwritten by centralized updates.
- **[Mitigation]** The backend logic explicitly prioritizes `rcm_controls` values over `account_assertions` defaults. If a value exists in `rcm_controls`, it is preserved.

## Migration Plan

1. Generate Drizzle migration for the `account_assertions` table.
2. Apply migration using `npx drizzle-kit push`.
3. Deploy updated worker routes.
4. Deploy frontend changes.
