## 1. Global Layout & Sidebar

- [ ] 1.1 Modify `src/components/app-sidebar.tsx`: Set `collapsible="none"` and apply `text-[11px]` to menu items and `text-[9px]` to group labels.
- [ ] 1.2 Update `src/components/layout/AppLayout.tsx`: Remove `SidebarTrigger` and adjust header layout to account for static sidebar.
- [ ] 1.3 Ensure `SidebarProvider` in `AppLayout.tsx` defaults to `open={true}` and is non-toggleable.

## 2. RCM Matrices UI Scaling

- [ ] 2.1 Update `src/pages/rcm/RCMTLCPage.tsx`: Standardize all text, inputs, and selects to `text-[10px]`.
- [ ] 2.2 Update `src/pages/rcm/RCMELCPage.tsx`: Standardize all text, inputs, and selects to `text-[10px]`.
- [ ] 2.3 Update `src/pages/rcm/RCMITGCPage.tsx`: Standardize all text, inputs, and selects to `text-[10px]`.

## 3. Edit Indicators & Feedback

- [ ] 3.1 Implement a `DirtyIndicator` logic in RCM pages by comparing `localItems` with `matrixData.items`.
- [ ] 3.2 Apply visual indicator (e.g., right-border highlight) to changed inputs in all three RCM matrix pages.

## 4. Scrollbar Optimization

- [ ] 4.1 Refactor `src/pages/rcm/RCMTLCPage.tsx` container height and overflow to eliminate nested scrollbars.
- [ ] 4.2 Refactor `src/pages/rcm/RCMELCPage.tsx` container height and overflow to eliminate nested scrollbars.
- [ ] 4.3 Refactor `src/pages/rcm/RCMITGCPage.tsx` container height and overflow to eliminate nested scrollbars.
- [ ] 4.4 Verify sticky header functionality in all RCM pages after scrollbar unification.
