## 1. Hook and Calculation Changes

- [x] 1.1 Add draft parameters states (`draftBasis`, `draftOmPercentage`, `draftHaircutPercentage`) inside `useScopingEditor` in `src/pages/scoping/hooks/useScopingPage.ts`.
- [x] 1.2 Derive `isStale` flag in `useScopingEditor` by comparing draft states with active `simState` values.
- [x] 1.3 Create `handleRecalculate` in `useScopingEditor` to run calculations, toggle `isRecalculating` state with a short setTimeout delay, and update `simState` with draft parameters.
- [x] 1.4 Modify `save` mutation logic in `useScopingEditor` to force recalculation if the state is stale prior to sending the API payload.

## 2. Component and UI Updates

- [x] 2.1 Update parameter controls in `MaterialityParamsCard.tsx` to bind to draft states and update draft states instead of active ones.
- [x] 2.2 Add the Recalculate button and stale warning messages to `MaterialityParamsCard.tsx`.
- [x] 2.3 Integrate `isRecalculating` loading state into `ScopingEditor` and pass it down to `ScopingEditorContent.tsx`.
- [x] 2.4 Add loading overlay spinner block to `ScopingEditorContent.tsx` when `isRecalculating` is active.
- [x] 2.5 Ensure i18n localization translation entries for warnings, labels, and recalculate button exist in i18n locales.

## 3. Validation

- [x] 3.1 Run TypeScript type check validation: `npm run type-check`.
- [x] 3.2 Run lint verification check: `npm run lint`.
- [x] 3.3 Run build validation test: `npm run build`.
