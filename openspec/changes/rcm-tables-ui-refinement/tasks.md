## 1. Component Refactoring

- [x] 1.1 Update `src/components/ui/table.tsx` to add `noWrapper` prop (boolean) to the `Table` component.
- [x] 1.2 Implement conditional rendering in `Table` to skip the wrapping `div` if `noWrapper` is true.

## 2. RCM Matrix Pages UI Update

- [x] 2.1 Refactor `src/pages/rcm/RCMTLCPage.tsx`: use `<Table noWrapper>`, add `overflow-auto` to matrix container, and change zebra stripe color to `bg-[#A9A9A9]`.
- [x] 2.2 Refactor `src/pages/rcm/RCMITGCPage.tsx`: use `<Table noWrapper>`, add `overflow-auto` to matrix container, and change zebra stripe color to `bg-[#A9A9A9]`.
- [x] 2.3 Refactor `src/pages/rcm/RCMELCPage.tsx`: use `<Table noWrapper>`, add `overflow-auto` to matrix container, and change zebra stripe color to `bg-[#A9A9A9]`.

## 3. Verification and Quality Assurance

- [x] 3.1 Run `npm run type-check` and resolve any TypeScript errors.
- [x] 3.2 Run `npm run lint` and fix any styling/linting violations.
- [x] 3.3 Run `npm run build` to ensure the changes are production-ready.
- [x] 3.4 Manually verify that only one horizontal scrollbar exists on each RCM page and sticky headers are functional.
