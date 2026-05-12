## Why

Align the platform's testing and reporting modules with the mandatory **Regulation SK-5/DKU.MBU/11/2024** (specifically Lampiran 7 for TOE/CSA and Lampiran 8 for TOD). This ensures regulatory compliance for BUMN entities, improves the audit trail with granular sampling, and addresses existing code smells to maintain high technical integrity.

## What Changes

- **Regulatory Sampling UI**: Implement a tabular sampling grid in the Test Workbench that follows the Lampiran 7 format (Atribut A, B, C, D) for TOE and CSA activities.
- **Test of Design (TOD) Checklist**: Expand the TOD evaluation form to strictly follow the 6-pilar verification criteria (Objective, Timing, Authority, Reliability, Coverage, Evidence) as per Lampiran 8.
- **Zero Tolerance Logic**: Implement automatic "Ineffective" status calculation if any single sample fails an attribute in TOE/CSA.
- **Drizzle Schema Update**: Add new columns/tables to support granular sampling data and extended TOD attributes (**BREAKING** if existing test data is not migrated).
- **Notification Bell**: Add a global notification bell to the sidebar/header to alert users of pending CSA/Testing tasks or remediation requirements.
- **Unsaved Changes Guard**: Integrate the `UnsavedChangesGuard` (consistent with `implement-unsaved-changes-warning` proposal) across all data-entry heavy forms (RCM, Test Workbench).
- **Localization (i18n)**: Fully localize all new regulatory terms and form labels in `src/i18n/`.
- **Code Hygiene Refactor**: Systematically identify and fix code smells (SOLID, DRY, Clean Code) across the `testing` and `reports` modules.

## Capabilities

### New Capabilities
- `granular-test-sampling`: Support for row-by-row sample testing with pass/fail attributes per Lampiran 7.
- `tod-six-pillar-verification`: Strict verification of control design quality based on the 6 pillars defined in Lampiran 8.
- `global-compliance-alerts`: Notification system for critical ICOFR lifecycle events.

### Modified Capabilities
- `csa-management`: Update the CSA workflow to use the new granular sampling capability.
- `unsaved-changes-guard`: Expand the guard to cover the new regulatory forms.

## Impact

- **Database**: Drizzle schemas for `controls`, `tests`, and potentially a new `test_samples` table.
- **API**: Updates to `/api/tests` and `/api/controls` to handle granular sampling data.
- **UI**: Significant overhaul of `TestWorkbench.tsx` and `ControlTestCard.tsx`.
- **Navigation**: Sidebar update for the notification bell.
- **Compliance**: Direct alignment with SK-5 regulatory reporting requirements.
