## 1. Specification & Documentation

- [x] 1.1 Archive the spec delta for `unsaved-changes-guard` to document the new behavior under locked states

## 2. Frontend Implementation

- [x] 2.1 Update `src/pages/scoping/hooks/useScopingPage.ts` to add short-circuit logic inside the `isDirty` calculation so it returns `false` if `simState.workflowStatus` is not Draft or Rejected
- [x] 2.2 Normalize data structures in the `isDirty` calculation of `useScopingPage.ts` by adding fallbacks (`|| ''`, `|| 0`, `|| {}`) for null/undefined database values to prevent false positives


## 3. Verification & testing

- [x] 3.1 Run compilation verification `npm run type-check` to ensure no TypeScript compilation issues are introduced
- [x] 3.2 Verify the page behaviors locally by checking if approved scoping simulations can be rolled back or unlocked without showing the "unsaved changes" warning

