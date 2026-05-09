## Why

The current UI contains redundant controls ('Pin/Unpin') in the header which complicates the interface. Furthermore, the RCM tables lack sufficient visual distinction between rows, making them difficult to scan and interpret effectively. This change streamlines the UI by removing the redundant pin control and improves data readability through zebra-striping.

## What Changes

- **Remove Pin/Unpin**: The 'Pin/Unpin' button will be removed from `MainHeader.tsx`.
- **Zebra-Striping**: Implement zebra-striping (alternating row background colors: white and `slate-50`) in RCM tables for `RCMTLCPage`, `RCMELCPage`, and `RCMITGCPage`.

## Capabilities

### New Capabilities
- `ui-layout-refinement`: Consolidates changes to header structure and table styling conventions.

### Modified Capabilities
- None.

## Impact

- `src/components/layout/MainHeader.tsx`: Removing the Pin/Unpin button.
- `src/pages/rcm/RCMTLCPage.tsx`, `src/pages/rcm/RCMELCPage.tsx`, `src/pages/rcm/RCMITGCPage.tsx`: Applying zebra-striping CSS classes to table rows.
