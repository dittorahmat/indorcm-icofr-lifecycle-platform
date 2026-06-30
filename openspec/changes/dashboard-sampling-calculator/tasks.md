## 1. Setup & Component Implementation

- [x] 1.1 Create `CSARealizationTable.tsx` in `src/components/dashboard/`
- [x] 1.2 Implement grouping logic of controls by `frequency` (Annual, Quarterly, Monthly, etc.)
- [x] 1.3 Map each frequency group to its BUMN SK-5 Table 22 target range text
- [x] 1.4 Calculate realization progress: count how many controls in each group have completed CSA statuses
- [x] 1.5 Render progress bars (`Progress` component) showing completion percentage for each row
- [x] 1.6 Add localization strings for table headers, frequencies, and progress labels in English and Indonesian locales (`src/i18n/locales/*/dashboard.json`)

## 2. Page Integration & Verification

- [x] 2.1 Integrate the `CSARealizationTable` component into the right sidebar of `src/pages/Dashboard.tsx` (below the dashed Compliance banner)
- [x] 2.2 Add unit testing for the new realization table component
- [x] 2.3 Verify system compilation and standards (typecheck, lint, build)
