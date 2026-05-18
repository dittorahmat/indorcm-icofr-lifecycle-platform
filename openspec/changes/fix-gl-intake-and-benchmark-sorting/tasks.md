## 1. Database & Setup

- [x] 1.1 Run Drizzle kit push to ensure schema alignment (`npx drizzle-kit push`).
- [x] 1.2 Verify `no_urut` and `fsli_name` columns availability in `gl_rows` table.

## 2. GL Intake Resilience

- [x] 2.1 Update `src/pages/scoping/services/gl-parser.ts` filter logic to allow rows with `fsliName` but empty `glDesc`.
- [x] 2.2 Update `src/components/scoping/GLDataIntake.tsx` processData logic to preserve FSLI-only rows.
- [x] 2.3 Create automated test for GL parsing that includes subtotal rows with empty descriptions.

## 3. Hierarchical Benchmark Sorting

- [x] 3.1 Refactor `uniqueFsliData` memoization in `src/components/scoping/SetBenchmarkModal.tsx` to track `minNoUrut` per FSLI group.
- [x] 3.2 Implement sorting by `minNoUrut` (ascending) in the benchmark selection table.
- [x] 3.3 Create automated test to verify FSLIs are sorted by their natural report order instead of alphabetically.

## 4. UX & Compliance

- [x] 4.1 Implement `useUnsavedChanges` hook in the benchmark selection flow to prevent accidental data loss.
- [x] 4.2 Extract all UI strings to localization files in `src/i18n/` (Indonesian and English).
- [x] 4.3 Add a notification bell event and success toast after benchmark selection is successfully saved.
- [x] 4.4 Verify and update sidebar menu links if necessary to ensure easy access to the scoping module.

## 5. Refactor & Quality Assurance

- [x] 5.1 Perform code hygiene refactor on scoping components applying SOLID, DRY, and KISS principles.
- [x] 5.2 Validate that no API endpoints or imports are broken after the refactoring phase.
- [x] 5.3 Run full validation suite: `npm run type-check`.
- [x] 5.4 Run full validation suite: `npm run lint`.
- [x] 5.5 Run full validation suite: `npm test`.
- [x] 5.6 Run full validation suite: `npm run build`.
