## 1. Preparation & Localization

- [x] 1.1 Synchronize local database state with `npx drizzle-kit push`.
- [x] 1.2 Add translation keys for "Add Manual Sample", "Sample Reference", and "Type reference..." in `src/i18n/locales/id/bpm.json`.
- [x] 1.3 Add corresponding translation keys in `src/i18n/locales/en/bpm.json`.

## 2. UI Refinement: Summary Status Matrix

- [x] 2.1 Update `CSATabContent.tsx` table headers to display `ctrl.name` instead of `ctrl.code`.
- [x] 2.2 Refactor `sampleRef` column to use a controlled `Input` component linked to `react-hook-form`.
- [x] 2.3 Implement "Add Manual Sample" button above the matrix that appends a new blank sample to the form.
- [x] 2.4 Initialize `controlResults` for manual samples with all `activeControls` to ensure consistency.

## 3. UI Refinement: Grouped Detailed Verification

- [x] 3.1 Refactor the `Detailed Verification & Evidence` table rendering logic to group control points by `sampleRef`.
- [x] 3.2 Add a grouping header row for each sample in the Detailed table to improve visual scanning.
- [x] 3.3 Ensure real-time synchronization between Matrix input and Detailed table headers.

## 4. Standards & Safety

- [x] 4.1 Integrate `useUnsavedChanges` hook in `CSATabContent.tsx` to prevent data loss on navigation.
- [x] 4.2 Verify the Notification Bell in `app-sidebar.tsx` correctly displays unread counts.
- [x] 4.3 Apply clean code principles (DRY, KISS) to any refactored logic in the tables.

## 5. Quality Assurance & Validation

- [x] 5.1 Run `npm run type-check` and fix any TypeScript errors.
- [x] 5.2 Run `npm run lint` and resolve any styling or code quality issues.
- [x] 5.3 Run `npm run build` to ensure production-ready stability.
