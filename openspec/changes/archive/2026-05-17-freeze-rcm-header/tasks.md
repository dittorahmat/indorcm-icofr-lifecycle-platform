## 1. Component Refinement

- [x] 1.1 Update `RCMTable.tsx` wrapper `div` to include `overflow-auto` and remove `flex-1` if it conflicts with parent scroll.
- [x] 1.2 Ensure `thead` has proper `sticky top-0` and `z-index` to stay above body rows.
- [x] 1.6 Remove all horizontal sticky column logic (left/right) from `RCMTable.tsx`.
- [x] 1.7 Clean up `RCMColumn` interface to remove sticky properties if no longer used.
- [x] 1.5 Update `RCMGroupRow.tsx` to be `sticky` with `top-[88px]`.
- [x] 1.8 Remove `sticky` property usage in `RCMTLCPage.tsx`, `RCMELCPage.tsx`, and `RCMITGCPage.tsx`.

## 2. Page Layout Adjustments

- [x] 2.1 Refactor `RCMTLCPage.tsx` to ensure the table container occupies the remaining vertical space with `overflow-hidden` on parent and `overflow-auto` on the table wrapper.
- [x] 2.2 Refactor `RCMELCPage.tsx` similarly to TLC page.
- [x] 2.3 Refactor `RCMITGCPage.tsx` similarly to TLC page.
- [x] 2.4 Unify scroll context by adding `noScroll` support to `AppLayout` and using it in RCM pages.
- [x] 2.5 Remove restrictive width limits in `App.css` that caused layout breakage.

## 3. Verification & CI

- [x] 3.1 Create/Update tests to verify that the table container has the correct CSS classes for sticky headers.
- [x] 3.2 Run `npm run type-check` to ensure no regression in types.
- [x] 3.3 Run `npm run lint` to ensure code standards.
- [x] 3.4 Run `npm test` to verify all tests pass.
- [x] 3.5 Run `npm run build` as the final integrity check.
