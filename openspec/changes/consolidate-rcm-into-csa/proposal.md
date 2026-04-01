## Why
The current application has redundant navigation items for RCM and CSA. The user wants to consolidate the "RCM Matrix (TLC)" view directly into the CSA Workspace to provide a unified "Risk Control" perspective, simplifying the user interface and reducing navigation complexity.

## What Changes
- **CSA Workspace Update**:
  - Add a new tab named "Risk Control" to the `CSAWorkspace` component.
  - Duplicate the logic and UI from the "RCM Matrix (TLC)" tab in `RCMList.tsx` into this new tab.
  - This includes the search functionality, RCM cards, and BPM Flow dialog.
- **Navigation Cleanup**:
  - Remove "RCM" from the main header navbar (`MainHeader.tsx`).
  - Remove "RCM & BPM (Lampiran 4)" and "Change Log (Lampiran 6)" from the app sidebar (`app-sidebar.tsx`).
  - *Note*: If other tabs in `RCMList` (Indirect ELC, SOC, Apps) are still needed, they should be moved as well or the RCM route kept but renamed. However, the user specifically asked to remove RCM and sidebar items.

## Capabilities
### New Capabilities
- `csa-risk-control-matrix`: Integration of the RCM Matrix view within the CSA Workspace.

### Modified Capabilities
- None

## Impact
- `src/pages/csa/CSAWorkspace.tsx`: Significant UI addition.
- `src/components/layout/MainHeader.tsx`: Navigation item removal.
- `src/components/app-sidebar.tsx`: Sidebar item removal.
- `src/pages/rcm/RCMList.tsx`: Logic source for duplication.
