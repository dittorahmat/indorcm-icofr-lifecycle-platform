## 1. Input Component Focus Auto-Selection

- [x] 1.1 Update `src/components/ui/input.tsx` to add `selectOnFocus` prop, numeric/currency detection helper, and focus selection handler with `requestAnimationFrame` fallback. Verify with type check and visual examination.
- [x] 1.2 Create `src/components/ui/input.test.tsx` to verify auto-selection on focus for `type="number"`, `inputMode="numeric"`, `selectOnFocus`, and verify non-selection for standard text inputs. Verify with `npm test src/components/ui/input.test.tsx`.

## 2. Quality & Regression Verification

- [x] 2.1 Run codebase LOC gate, TypeScript check, and linting suite to verify compliance with repository standards. Verify with `npm run check:loc -- src/components/ui/input.tsx` and `npm run type-check`.
