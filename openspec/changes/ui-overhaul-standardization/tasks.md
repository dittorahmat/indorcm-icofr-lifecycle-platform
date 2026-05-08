## 1. Theme and Header Consolidation

- [x] 1.1 Update `src/hooks/use-theme.ts` to force `isDark` to `false` and remove storage/effect logic.
- [x] 1.2 Modify `src/components/layout/MainHeader.tsx`:
    - [x] Remove `<ThemeToggle />` and its import.
    - [x] Replace `<NotificationBell />` with the more advanced `<NotificationCenter />`.
    - [x] Adjust spacing/layout to ensure the single Bell is correctly positioned.
- [x] 1.3 Remove redundant notification bell icons from page-level headers:
    - [x] `src/pages/csa/TodoListPage.tsx` (remove `<Bell />` from toolbar/calendar).
    - [x] `src/pages/notifications/NotificationsPage.tsx` (keep title icon but remove any interactive bell if present).
- [x] 1.4 Remove `src/components/ThemeToggle.tsx` and its usage in `src/pages/DemoPage.tsx`.

## 2. Sidebar Overhaul (Ref PDF)

- [x] 2.1 Update `src/components/app-sidebar.tsx` background to `#87CEEB` and text to **Bold Black**.
- [x] 2.2 Disable sidebar collapsibility (set `collapsible="none"`).
- [x] 2.3 Remove internal scrolling from sidebar in `AppSidebar.tsx` to use global scroll.
- [x] 2.4 Replace the `Bell` icon in sidebar (link to /notifications) with `Megaphone` or `ClipboardList`.

## 3. Global Scroll and Grid Standardization

- [x] 3.1 Modify `src/components/layout/AppLayout.tsx` and `src/components/ui/sidebar.tsx` to enable a single global scrollbar for the entire page.
- [x] 3.2 Update `src/components/ui/table.tsx` or global CSS:
    - [x] Thicken all borders (Excel-style).
    - [x] Add Zebra Striping (`even:bg-slate-100/50`).
- [x] 3.3 Remove `ScrollArea` and `overflow-auto` from all major data grids (Scoping, RCM, CSA) to allow vertical expansion.
- [x] 3.4 Implement "row-below" inline editing in `src/components/rcm/ControlEditor.tsx` with row freezing.

## 4. Page Layout Swaps (Ref PDF)

- [x] 4.1 `ScopingPage.tsx`: Move Parameter panel to **Right**, Grid/Tabs to **Left**.
- [x] 4.2 `CSATabContent.tsx`: Move Assessment History to **Left**, Chart/Flow to **Right**.

## 5. Flow Optimization

- [x] 5.1 Update `src/pages/LoginPage.tsx` to redirect directly to `/dashboard` instead of `/welcome`.

## 6. Verification

- [x] 6.1 Confirm Header only has 1 Notification Center and NO Theme Toggle.
- [x] 6.2 Confirm Sidebar is Skyblue, Bold Black, and Static.
- [x] 6.3 Confirm Global Scrollbar handles Sidebar + Content + Grid as one unit.
- [x] 6.4 Confirm Zebra Striping and thick borders on all tables.
