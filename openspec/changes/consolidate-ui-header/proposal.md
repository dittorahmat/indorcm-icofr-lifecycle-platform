## Why

The current user interface has multiple notification bells and dark mode toggles in various locations (MainHeader, Sidebar, and mobile views), creating visual clutter and confusing the user. Additionally, the theme strategy needs to be simplified by establishing a single default theme and removing the ability to toggle, providing a more consistent and brand-aligned experience.

## What Changes

- **Consolidate Notification Bell**: Remove all redundant notification bell icons or interactive centers, keeping exactly one interactive `NotificationBell` in the `MainHeader`.
- **Remove Theme Toggle**: Remove the `ThemeToggle` component from the `MainHeader` and any other locations (like `DemoPage`).
- **Standardize Default Theme**: Set the "Blue (Classic)" theme as the permanent and default theme for the application.
- **Sidebar Cleanup**: Replace the notification bell icon in the sidebar link to `/notifications` with a more appropriate icon or label to avoid visual duplication with the header's interactive bell.

## Capabilities

### New Capabilities
- `ui-header-standardization`: Consolidates global actions (notifications, profile) into a single, standardized header and locks the visual theme.

### Modified Capabilities
- `compliance-notification-system`: Update requirement to strictly define the entry point for notifications as the global header only.

## Impact

- `src/components/layout/MainHeader.tsx`: Significant cleanup of the action area.
- `src/components/app-sidebar.tsx`: Update to navigation item icons.
- `src/hooks/use-theme.ts`: Locking the theme state.
- `src/components/ThemeToggle.tsx`: Deprecation or removal of the component.
- `src/pages/notifications/NotificationsPage.tsx`: Ensuring consistency with the header-only entry point.
