## Context
Consolidating navigation to the sidebar to avoid redundancy and improve UI focus.

## Goals / Non-Goals
**Goals:**
- Single point of navigation (Sidebar).
- Cleaner header containing only essential actions (Theme, Profile) and Brand identity.

**Non-Goals:**
- Changing the URL structure or routing logic.

## Decisions
- **MainHeader.tsx**: Strip out the `navItems` array and the desktop/mobile nav elements. Keep the `header` container, `Link` to dashboard (logo), `ThemeToggle`, and `DropdownMenu` (profile).
- **app-sidebar.tsx**: Add a new `SidebarMenuItem` for "Import" under the "Planning & Risk" group, visible only to 'Line 2' users.

## Risks / Trade-offs
- [Discoverability] → Users accustomed to the top bar might need a moment to find the sidebar trigger. *Mitigation*: The `SidebarTrigger` is always visible in the header area.
