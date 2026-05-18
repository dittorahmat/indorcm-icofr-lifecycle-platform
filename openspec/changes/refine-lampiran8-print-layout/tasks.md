## 1. CSS Print Refinements

- [x] 1.1 Update `src/index.css` to add `print:hidden` to the `MainHeader` class or its wrapper, ensuring the application header is hidden during print.
- [x] 1.2 Update `src/index.css` to force `white-space: normal` and `word-break: break-word` on `th` and `td` elements within `table` during print, allowing tight text wrapping to save horizontal space.
- [x] 1.3 Update `src/index.css` to adjust the `zoom` or `transform: scale()` specifically for wide tables if text wrapping isn't sufficient to fit everything on a landscape page.

## 2. Layout Integration

- [x] 2.1 Verify `MainHeader.tsx` or `AppLayout.tsx` correctly applies the new `print:hidden` class or that the global CSS rule targets its existing classes effectively.

## 3. Testing and Validation

- [x] 3.1 Run `npm run type-check` to ensure no TypeScript errors.
- [x] 3.2 Run `npm run lint` and `npm run build` to verify production readiness.
- [x] 3.3 Manually test the "Print / Export PDF" button on `VerificationDesignPage` to confirm the header is gone, all columns fit, and it looks like a formal document.
