## Why

Long menu labels in the sidebar (especially in Indonesian) are being truncated with ellipses because of fixed heights and forced truncation styles. This prevents users from reading full menu items, reducing usability and accessibility.

## What Changes

- Modify `SidebarMenuButton` and `SidebarMenuSubButton` to support multi-line text wrapping.
- Change fixed heights to flexible heights with minimum values.
- Adjust overflow and text-overflow properties to allow standard browser wrapping.
- Ensure wrapped text maintains proper alignment with menu icons.
- Preserve truncation behavior only when the sidebar is collapsed (icon mode).

## Capabilities

### New Capabilities
- `sidebar-text-wrapping`: Defines the requirements for responsive text behavior within sidebar navigation elements, ensuring legibility across different languages and label lengths.

### Modified Capabilities
<!-- No existing capabilities require behavioral requirement changes -->

## Impact

- `src/components/ui/sidebar.tsx`: Primary component styling changes.
- `src/components/app-sidebar.tsx`: Potential adjustments to icon alignment or spacing if needed for wrapped text.
- Global Sidebar UI: Visual consistency across all pages using the sidebar.
