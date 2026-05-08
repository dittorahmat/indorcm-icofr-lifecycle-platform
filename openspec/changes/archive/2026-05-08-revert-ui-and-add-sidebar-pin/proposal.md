## Why

The recent UI overhaul introduced a high-contrast Skyblue theme and dynamic sidebar behavior that deviated from the established branding and user preference for a persistent, stable navigation structure. Users require a way to "lock" the sidebar in an expanded state to maintain consistent navigation context while still having the option to collapse it for more screen real estate.

## What Changes

- **Style Revert**: Revert the `MainHeader` and `AppSidebar` background colors and font styles to match the state at commit `fcd4f95` (Tuft Blue header, Deep Blue sidebar, White text).
- **Sidebar Header Restoration**: Restore the original brand logo and header structure inside the sidebar.
- **Pinning Logic**: Introduce a "Pin" toggle in the sidebar.
- **Default State**: Set the default sidebar state to "Pinned" and "Expanded".
- **Dynamic Behavior**: 
    - When **Pinned**: Sidebar is static (`collapsible="none"`) and pushes main content.
    - When **Unpinned**: Sidebar is dynamic (`collapsible="icon"`) and can be collapsed to a mini-bar.

## Capabilities

### New Capabilities
- `sidebar-pinning-system`: Management of sidebar persistence, pinning state, and transition between static and dynamic layouts.

### Modified Capabilities
- None

## Impact

- `src/components/layout/MainHeader.tsx`: Background and text color styles.
- `src/components/app-sidebar.tsx`: Background styles, font weights, and addition of the Pin toggle.
- `src/components/ui/sidebar.tsx`: Enhancement of `SidebarContext` and `Sidebar` component to support pinning state.
- `src/components/layout/AppLayout.tsx`: Removal of hardcoded `open={true}` to allow state-driven behavior.
