## 1. Refactor Sorting Logic

- [x] 1.1 Implement `sortGLHierarchically` utility in `src/lib/compliance-utils.ts` to handle FSLI and GL sorting by `noUrut`.
- [x] 1.2 Add unit tests for `sortGLHierarchically` to ensure hierarchical numeric order is correct.

## 2. Update GLDataGrid Component

- [x] 2.1 Update `sortedData` useMemo in `src/components/scoping/GLDataGrid.tsx` to use the new utility.
- [x] 2.2 Change default `columnVisibility` for `noUrut` from `false` to `true`.
- [x] 2.3 Ensure the table container is responsive to width changes from the parent.

## 3. Update ScopingPage Layout

- [x] 3.1 Implement `isSidebarCollapsed` state and toggle function in `ScopingEditor` component within `src/pages/scoping/ScopingPage.tsx`.
- [x] 3.2 Refactor the layout grid to move the Parameters card to the left sidebar.
- [x] 3.3 Apply `framer-motion` to the sidebar for smooth collapse/expand transitions.
- [x] 3.4 Adjust the main worksheet container to take `100%` width when the sidebar is collapsed.

## 4. Verification & Polish

- [x] 4.1 Run `npm run type-check` and `npm run lint` to ensure code quality.
- [x] 4.2 Verify sorting with sample data (e.g., FSLI A, B, C example from user).
- [x] 4.3 Test toggle interaction and responsiveness on different screen sizes.
- [x] 4.4 Final clean-up: Remove any console logs or unused code smells.
