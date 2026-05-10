## Why

The current RCM matrix editing experience is disjointed and inefficient, relying on cumbersome "Edit Row" toggles that expand the table size unpredictably. Users also find the table visual density and zebra-striping style distracting, hindering data readability and focus. This change will modernize the editing workflow to a per-row, intuitive inline interaction and refine the UI aesthetic for better readability and alignment with BUMN regulatory standards.

## What Changes

- Implement per-row inline editing:
  - Add action controls column (Edit ✎, Save ✓, Cancel ✕) to the leftmost side of RCM TLC, ITGC, and ELC tables.
  - Standardize interaction logic to direct inline input fields without expanding row height.
  - Remove table-wide zebra-striping, switching to clean row separators and subtle hover states.
- Aesthetic improvements:
  - Standardize RCM page headers (layout, search, filter, company/location info).
  - Modernize IPO/Assertion matrix indicators using color-coded subtle backgrounds instead of solid text styles.
  - Refine row whitespace and typography for improved readability (remove unnecessary font-black and uppercase).
- Infrastructure updates:
  - Integrate `UnsavedChanges` guard consistently across all pages.
  - Standardize `i18n` localization keys.
  - Add global `NotificationBell` to the sidebar area.
  - Run database schema synchronization (`drizzle-kit push`).

## Capabilities

### New Capabilities
- `rcm-inline-editor`: Standardized, intuitive per-row inline editing pattern for all RCM tables.
- `rcm-ui-aesthetic`: Refined layout, typography, and color-coding for RCM matrix clarity and readability.

### Modified Capabilities
- `rcm-lifecycle-management`: Updating existing RCM page workflows to incorporate the new inline editor and aesthetic standards.

## Impact

- `src/pages/rcm/`: RCMTLCPage, RCMITGCPage, RCMELCPage components.
- `src/components/layout/`: Global sidebar/header components.
- Database: Drizzle schema push.
- `src/i18n/`: Updates to localization resources.
