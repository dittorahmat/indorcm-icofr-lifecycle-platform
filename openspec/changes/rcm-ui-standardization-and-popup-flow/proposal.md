## Why

The current RCM matrix pages (ELC, TLC, ITGC) face several UI/UX challenges that hinder auditor efficiency. These include high cognitive load due to extreme information density (up to 34 columns), lack of visual hierarchy, and inconsistent typography. Additionally, the current inline editing flow is prone to errors and lacks a unified safety mechanism for unsaved changes. This change aims to transform the RCM pages into a professional, standardized "Auditor Workbench" that complies with SK-5/DKU.MBU/11/2024 while prioritizing usability and data integrity.

## What Changes

- **Standardized Typography**: Unified font families and sizes across all RCM pages (ELC, TLC, ITGC) to improve readability and professionalism.
- **Group Headers**: Implementation of multi-level grouping in tables to maintain context during horizontal scrolling, pulling repeated "Process Info" into category dividers.
- **Enhanced Borders**: Prominent horizontal grid lines and vertical guides every 5 columns to prevent line-slipping in wide tables.
- **Popup Edit Flow**: Replacement of inline editing with a structured, multi-section Dialog/Modal for each control mapping.
- **Integrated Assessment Flow**: Overhaul of `TODVerificationDialog` to allow editing of RCM master data during evaluation, ensuring data parity between RCM TLC and CSA modules.
- **Redundancy Cleanup**: Removal of redundant "Action" columns where sticky pencil icons are already present at the start of the row.
- **Unsaved Changes Guard**: Integration of the `unsaved-changes-guard` (from archived proposal) into all RCM edit flows to prevent data loss.
- **Localization (i18n)**: Comprehensive localization of all new UI elements and labels in `@src/i18n/`.
- **Infrastructure & Hygiene**:
    - Automatic Drizzle migrations via `npx drizzle-kit push` if schema updates are required for new form fields.
    - Global "Notification Bell" integration if required for status updates.
    - Systematic refactor of "code smells" and dead code using SOLID, DRY, KISS, and YAGNI principles.
- **Verification**: Strict adherence to TDD, including type-checking, unit testing, linting, and full build verification.

## Capabilities

### New Capabilities
- `rcm-standardized-components`: A reusable set of RCM-specific table and form components to ensure UI consistency across all levels.
- `compliance-notification-system`: (If applicable) Integration of a global notification bell for audit status and system alerts.

### Modified Capabilities
- `unsaved-changes-guard`: Extension of the safety mechanism to cover the new popup edit forms in RCM pages.
- `rcm-matrix-management`: Requirements updated to support grouped headers, standardized typography, and the new popup edit flow.

## Impact

- `src/pages/rcm/`: Refactor of `RCMELCPage`, `RCMTLCPage`, and `RCMITGCPage`.
- `src/components/rcm/`: New `RCMTable`, `RCMGroupHeader`, and `RCMEditDialog` components.
- `src/components/ui/table.tsx`: Potential enhancements for border styling and grouping support.
- `src/i18n/`: Updates to translation files.
- `src/hooks/`: Integration of `useUnsavedChanges`.
- `drizzle/schema.ts`: Potential updates for extended control mapping metadata.
- `src/components/layout/AppLayout.tsx`: Potential integration of a notification bell.
