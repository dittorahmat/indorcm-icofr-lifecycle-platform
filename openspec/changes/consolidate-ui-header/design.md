## Context

The IndoGRC Pro application currently uses a hybrid layout where a global `MainHeader` (rendered by `RootLayout`) sits above a sidebar-driven `AppLayout`. Both the header and sidebar contain notification-related elements, and the header includes a theme toggle that switches between a classic blue theme and a dark green emerald theme.

## Goals / Non-Goals

**Goals:**
- Unify the notification entry point to a single interactive bell in the `MainHeader`.
- Lock the application theme to the "Blue (Classic)" light mode.
- Remove redundant theme and notification UI elements to improve clarity.

**Non-Goals:**
- Modifying the underlying notification logic or API.
- Changing the layout of the `NotificationsPage` (other than ensuring its icon doesn't conflict with the header).
- Removing the `NotificationCenter` component file (keep it for potential future use, though currently unused).

## Decisions

### 1. Default Theme Locking
- **Decision**: Update `useTheme` hook to force `isDark` to `false` and ignore `localStorage` values.
- **Rationale**: The user wants the classic blue theme (currently light mode) as the default. By locking it in the hook, we ensure consistency even if a user had previously saved a "dark" preference.
- **Alternative**: Removing the `useTheme` hook entirely. This is too disruptive as many components rely on its `isDark` property for conditional styling.

### 2. Header Cleanup
- **Decision**: Remove the `<ThemeToggle />` component call from `MainHeader.tsx`.
- **Rationale**: Simplifies the top-right action area.

### 3. Sidebar Icon Refinement
- **Decision**: Change the icon for the `/notifications` link in `AppSidebar.tsx` from `Bell` to `Megaphone` or `ClipboardList`.
- **Rationale**: Having two "Bell" icons visible simultaneously (one in the header, one in the sidebar) is confusing. A different icon for the "Full View" of notifications helps distinguish the page link from the interactive dropdown.

## Risks / Trade-offs

- **[Risk]** → Users who preferred the Green theme will lose it. **Mitigation**: The directive is to follow the user's current preference as the new default.
- **[Risk]** → Components that use `isDark` for styling might look "flat" if they rely on dark mode for contrast. **Mitigation**: Verify the Blue theme (Light mode) maintains proper accessibility across all pages.
