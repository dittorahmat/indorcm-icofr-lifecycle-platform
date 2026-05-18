## 1. Column Alignment (Lampiran 8)

- [x] 1.1 Update `columnGroups` in `src/pages/rcm/VerificationDesignPage.tsx` to include `Aplikasi Pendukung` (`supportingApp`).
- [x] 1.2 Update `columnGroups` in `src/pages/rcm/VerificationDesignPage.tsx` to include `Fungsi Pelaksana` (`executingFunction`).
- [x] 1.3 Update `columnGroups` in `src/pages/rcm/VerificationDesignPage.tsx` to include `Pelaku Pengendalian` (`executorRole`).
- [x] 1.4 Update `columnGroups` in `src/pages/rcm/VerificationDesignPage.tsx` to include `Item LK terdampak` (`affectedFsliItem`).
- [x] 1.5 Update `columnGroups` in `src/pages/rcm/VerificationDesignPage.tsx` to include `Periode Efektif` (`effectivePeriod`).

## 2. PDF Export Functionality

- [x] 2.1 Add a "Print / Export PDF" button to the header of `VerificationDesignPage.tsx` using `window.print()`.
- [x] 2.2 Add `@media print` CSS rules (likely in `App.css` or `index.css`) to ensure the table prints in landscape format.
- [x] 2.3 Ensure UI elements like sidebars, headers, and action buttons are hidden during print via CSS.

## 3. Testing and Validation

- [x] 3.1 Run `npm run type-check` to ensure no new errors were introduced.
- [x] 3.2 Run `npm run lint` and `npm run build` to verify production readiness.
- [x] 3.3 Manually verify that the printed output (PDF preview) displays the matrix correctly in landscape orientation without unnecessary UI elements.
