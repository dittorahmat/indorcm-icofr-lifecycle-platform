## 1. Research and Baseline

- [ ] 1.1 Verify current truncation behavior in browser (Indonesian translation)
- [ ] 1.2 Identify all occurrences of `truncate` and fixed heights in `src/components/ui/sidebar.tsx`

## 2. Core Style Updates

- [ ] 2.1 Update `sidebarMenuButtonVariants` in `src/components/ui/sidebar.tsx` to use `min-h-*` and `h-auto`
- [ ] 2.2 Replace `[&>span:last-child]:truncate` with conditional hiding for collapsed state in `SidebarMenuButton`
- [ ] 2.3 Remove `truncate` from `SidebarMenuSubButton` and update to `h-auto`
- [ ] 2.4 Update flex alignment from `items-center` to `items-start` for multi-line support in buttons

## 3. Sidebar Component Adjustments

- [ ] 3.1 Adjust vertical padding/margins in `SidebarMenuButton` variants to maintain aesthetic balance
- [ ] 3.2 Verify `SidebarMenuBadge` positioning remains correct when text wraps

## 4. Verification

- [ ] 4.1 Test long Indonesian menu items in expanded mode
- [ ] 4.2 Test sidebar collapsed mode to ensure no text leakage
- [ ] 4.3 Verify mobile view (sheet) behavior with wrapped text
- [ ] 4.4 Run build/lint to ensure no regressions in component library
