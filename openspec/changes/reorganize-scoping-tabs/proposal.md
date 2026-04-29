## Why

The current scoping simulation view in `ScopingPage.tsx` mixes data analysis (Benford's Law) and data integrity checks directly with the main scoping worksheet. This can overwhelm users with too much information on a single tab and doesn't follow a clear logical separation of tasks. Reorganizing the tabs will improve clarity, focus, and usability for the Line 2 users.

## What Changes

- **Tab Reorganization**: Refactor the simulation tabs into three distinct views:
  - **Scoping Worksheet**: Dedicated view for FSLI and account-level assessment using `GLDataGrid`.
  - **Activity Log**: Maintains the existing approval history and feedback timeline.
  - **Data Integrity**: New dedicated tab for `ScopingHealthDashboard` (Balance Check and Benford's Law Analysis).
- **Localization Updates**: Standardize labels for the new tab structure in both Indonesian and English locales.
- **Component Relocation**: Move the health dashboard from the worksheet view to the new integrity tab.

## Capabilities

### New Capabilities
- `scoping-data-integrity`: Dedicated capability for monitoring and analyzing the integrity and statistical health of uploaded GL data within a simulation.

### Modified Capabilities
- `scoping-simulation-workflow`: Update the UI structure of the scoping simulation to support the three-tab layout.

## Impact

- **Frontend**: `ScopingPage.tsx` will be significantly refactored in the `ScopingEditor` component.
- **Localization**: `src/i18n/locales/{id,en}/scoping.json` will be updated with new keys.
- **Components**: `ScopingHealthDashboard.tsx` usage will be moved.
