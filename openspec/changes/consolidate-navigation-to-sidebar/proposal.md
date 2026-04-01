## Why
The application currently has redundant navigation links in both the top header navbar and the sidebar. To improve consistency and provide a cleaner user interface, all navigation should be consolidated into the sidebar, making it the single source of truth for app navigation.

## What Changes
- **Sidebar Consolidation**:
  - Add the "Import" navigation item to `app-sidebar.tsx` for 'Line 2' users (it was previously only in the header).
- **Header Cleanup**:
  - Remove all navigation links (`navItems`, `<nav>`) from `MainHeader.tsx`.
  - Remove the mobile navigation Sheet/Menu button from `MainHeader.tsx` as the sidebar now handles all navigation via the `SidebarTrigger`.
- **UI Consistency**:
  - Ensure the header only contains the Logo, Title, Theme Toggle, and User Profile dropdown.

## Capabilities
### New Capabilities
- None

### Modified Capabilities
- `sidebar-only-navigation`: Unified navigation system focused on the sidebar.

## Impact
- `src/components/layout/MainHeader.tsx`: Complete removal of navigation logic and UI.
- `src/components/app-sidebar.tsx`: Addition of the "Import" link.
