## 1. Database & Persistence

- [x] 1.1 Define `tod_evaluations` table in Drizzle schema
- [x] 1.2 Generate and run database push (`npx drizzle-kit push`)
- [x] 1.3 Implement backend API route for TOD evaluation submission and retrieval

## 2. Shared Components & Hooks

- [x] 2.1 Create `TODVerificationDialog.tsx` (Lampiran 8 UI) using Shadcn/UI
- [x] 2.2 Create `CSAReviewMatrix.tsx` for the transposed (Control x Sample) view
- [x] 2.3 Implement logic to fetch master Control data for TOD pre-population
- [x] 2.4 Create a new `useTOD` hook to manage TOD state and mutations

## 3. Page Refactoring & Integration

- [x] 3.1 Refactor `CSAPage.tsx` to use a dedicated `CSARecordRow` component
- [x] 3.2 Implement expansion logic in `CSARecordRow` to reveal the review matrix
- [x] 3.3 Link the matrix "Control" clicks to open the `TODVerificationDialog`
- [x] 3.4 Ensure sample evidence links are accessible within the matrix cells

## 4. Safety & Governance

- [x] 4.1 Integrate `useUnsavedChanges` and `UnsavedChangesDialog` into the TOD form
- [x] 4.2 Implement notification trigger in backend when Line 1 signs off a CSA
- [x] 4.3 Add/update the notification bell in the main layout to alert Line 2 users

## 5. Localization & Quality Assurance

- [x] 5.1 Add new TOD and Matrix strings to `@src/i18n/` (Indonesian and English)
- [x] 5.2 Perform a comprehensive refactoring pass for SOLID/DRY compliance
- [x] 5.3 Run full verification suite: `tsc`, `npm run lint`, `npm test`, and `npm run build`


