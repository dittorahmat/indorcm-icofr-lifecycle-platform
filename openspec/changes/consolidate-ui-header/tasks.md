## 1. Theme Strategy Cleanup

- [ ] 1.1 Update `src/hooks/use-theme.ts` to default `isDark` to `false` and remove the effect that reads from `localStorage`.
- [ ] 1.2 Verify that the application renders correctly in the Blue theme (light mode) after locking.
- [ ] 1.3 Remove `ThemeToggle` usage from `src/pages/DemoPage.tsx` (and any other stray pages).

## 2. Header Consolidation

- [ ] 2.1 Modify `src/components/layout/MainHeader.tsx` to remove the `<ThemeToggle />` component.
- [ ] 2.2 Verify that `NotificationBell` remains correctly positioned in the header.
- [ ] 2.3 Remove unused imports (`ThemeToggle`, `Sheet`, etc. if no longer needed) from `MainHeader.tsx`.

## 3. Sidebar Refinement

- [ ] 3.1 Update `src/components/app-sidebar.tsx` to change the `Bell` icon for the `/notifications` link to `Megaphone` or `ClipboardList`.
- [ ] 3.2 Verify sidebar navigation still works and labels are clear.

## 4. Final Verification

- [ ] 4.1 Walk through key pages (Dashboard, Scoping, RCM) to ensure exactly one interactive bell is visible in the header.
- [ ] 4.2 Verify that no theme toggle exists in any part of the UI.
- [ ] 4.3 Check mobile view to ensure the header bell is accessible and no redundant bell exists in the sidebar/sheet.
