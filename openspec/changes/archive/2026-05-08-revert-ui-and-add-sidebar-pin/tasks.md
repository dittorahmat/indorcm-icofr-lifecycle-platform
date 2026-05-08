## 1. UI Component Enhancement

- [x] 1.1 Add `isPinned` and `setIsPinned` to `SidebarContextProps` in `src/components/ui/sidebar.tsx`.
- [x] 1.2 Implement `isPinned` state initialization from cookies and logic for `setIsPinned` (with cookie update) in `SidebarProvider`.
- [x] 1.3 Update `toggleSidebar` in `SidebarProvider` to ensure pinned sidebars remain expanded.
- [x] 1.4 Modify `Sidebar` component to dynamically set `collapsible` prop based on `isPinned` state.

## 2. Style Revert & Sidebar Branding

- [x] 2.1 Revert background and text colors in `src/components/layout/MainHeader.tsx` to Tuft Blue (#417dc1) and white.
- [x] 2.2 Restore `SidebarHeader` branding (logo and "IndoGRC Pro" title) in `src/components/app-sidebar.tsx`.
- [x] 2.3 Remove hardcoded Skyblue background and font-black styles from `AppSidebar` content and menu buttons.
- [x] 2.4 Add a Pin/Unpin toggle button in the `AppSidebar` header.

## 3. Layout Integration & Verification

- [x] 3.1 Remove hardcoded `open={true}` and `onOpenChange` override from `SidebarProvider` in `src/components/layout/AppLayout.tsx`.
- [x] 3.2 Verify that the sidebar state (open/collapsed and pinned/unpinned) persists correctly across page reloads using cookies.
