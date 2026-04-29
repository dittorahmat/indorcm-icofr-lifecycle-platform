## 1. Data Model & Backend Prep

- [x] 1.1 Update `worker/db/schema.ts` to ensure `sampleSize` and `homogeneityJustification` columns exist.
- [x] 1.2 Run `npx drizzle-kit generate` to create the migration.
- [x] 1.3 Run `npm run migrate` (or local equivalent) to apply changes to the D1 database.
- [x] 1.4 Update `shared/types.ts` to align `TestRecord` and `CSARecord` with the new schema requirements.

## 2. Localization & Utilities

- [x] 2.1 Add new error and warning strings to `src/i18n/locales/id/testing.json` and `src/i18n/locales/en/testing.json`.
- [x] 2.2 Refactor `src/lib/compliance-utils.ts` `getSuggestedSampleRange` to return exact Tabel 22 ranges (including min/max).
- [x] 2.3 Verify `compliance-utils.ts` logic with a small test script or unit test.

## 3. Core Validation Logic

- [x] 3.1 Implement conditional Zod validation in `src/pages/testing/TestWorkbench.tsx` for `sampleSize` and `homogeneityJustification`.
- [x] 3.2 Update the `onSubmit` handler to prevent submission when validation fails.
- [x] 3.3 Integrate the `useUnsavedChanges` hook into the `TestWorkbench` page.

## 4. UI Enhancements

- [x] 4.1 Update the Testing Form UI to show real-time "SK-5 Violation" badges when samples are below minimum.
- [x] 4.2 Display a clear instruction text explaining the requirement for justification.
- [x] 4.3 Ensure the Justification field shows a required indicator (*) dynamically when the sample size is low.

## 5. Verification & Testing

- [ ] 5.1 Manually verify "Hard Block" behavior for low sample sizes without justification.
- [ ] 5.2 Manually verify successful submission for low sample sizes WITH justification.
- [ ] 5.3 Verify that the `UnSavedChanges` dialog appears when navigating away with a dirty form.
