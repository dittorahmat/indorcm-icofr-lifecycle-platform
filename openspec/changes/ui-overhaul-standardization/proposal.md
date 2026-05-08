## Why

The current user interface requires a significant overhaul to align with user preferences for a more professional, brand-consistent, and efficient layout. Key issues include redundant notification bells, confusing theme toggles, and sub-optimal layout for critical pages like Scoping and CSA Assessment. Standardizing the UI according to specific brand colors (Skyblue #87CEEB) and behaviors (global scrollbar, zebra striping) will improve the overall user experience and application coherence.

## What Changes

- **Consolidate Notification Bell**: Remove all redundant notification bell icons, keeping exactly one interactive `NotificationBell` in the `MainHeader`.
- **Standardize Theme**: Lock the application to the "Blue (Classic)" light mode as the default. Remove all `ThemeToggle` components and references to dark mode.
- **Sidebar Overhaul**: 
    - Change background to Skyblue (#87CEEB) with **Bold Black** text.
    - Make sidebar static (no collapse/expand).
    - Remove sidebar internal scroll; it must use the global page scroll.
    - Keep existing menu grouping.
- **Layout Swapping**:
    - **Scoping Page**: Swap positions—Parameter identification to the **right**, Scoping Grid/Tabs to the **left**.
    - **CSA Assessment**: Swap positions—Assessment History to the **left**, Chart/Flow to the **right**.
- **Grid/Table Standardization**:
    - Thicken all table borders (Excel-style).
    - Implement **Zebra Striping** (alternating grey/white rows) for all tables.
    - Remove all internal scrollbars from grids; they must expand vertically and use the global scroll.
- **RCM Grid Inline Edit**: Implement an inline edit mode where a new input row appears below the target row, and other rows are "frozen" during editing.

## Capabilities

### New Capabilities
- `ui-standardization-overhaul`: Covers global UI standardization including header, sidebar, grids, and theme locking.

### Modified Capabilities
- `compliance-notification-system`: Update to strictly define header-only notification entry point.
- `csa-management`: Update layout requirements for assessment views.
- `gl-integration`: Update layout requirements for scoping parameters and grid views.

## Impact

- `src/components/layout/MainHeader.tsx`: Cleanup of global actions.
- `src/components/app-sidebar.tsx`: Significant styling and behavioral changes.
- `src/components/layout/AppLayout.tsx`: Adjustment to handle global scroll and static sidebar.
- `src/pages/scoping/ScopingPage.tsx`: Layout structure changes.
- `src/components/bpm/CSATabContent.tsx`: Layout structure changes.
- `src/components/ui/table.tsx`: Global styling for borders and zebra striping.
- `src/hooks/use-theme.ts`: Locking the theme state.
- `src/components/rcm/ControlEditor.tsx`: New inline editing logic.
