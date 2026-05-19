## Why

Currently, when the RCM ELC (Lampiran 5a) and RCM ITGC (Lampiran 5c) Matrix pages are viewed within the Execution Hub (BPMModal) "RCM" tab, they incorrectly render the application sidebar inside the modal's Action column. This occurs because these pages always use the `AppLayout` component, which includes the `AppSidebar`, even when the `embedded` prop is set to `true`. This creates a cluttered UI and obscures the "Action" column (Edit button).

## What Changes

- Modified `RCMELCPage` to bypass `AppLayout` when the `embedded` prop is true.
- Modified `RCMITGCPage` to bypass `AppLayout` when the `embedded` prop is true.
- Standardized the `embedded` prop behavior across all RCM Matrix pages (ELC, TLC, ITGC).

## Capabilities

### New Capabilities
- `rcm-matrix-view-modes`: Defines the presentation requirements for RCM Matrix pages in standalone and embedded contexts.

### Modified Capabilities
- `bpm-execution-hub`: Update to ensure that embedded RCM views are integrated correctly without layout artifacts.

## Impact

- `src/pages/rcm/RCMELCPage.tsx`
- `src/pages/rcm/RCMITGCPage.tsx`
- `src/components/bpm/BPMModal.tsx`
