## 1. Backend Join Logic Refinement

- [x] 1.1 Update `worker/routes/rcm.ts` to change `innerJoin` to `leftJoin` for `bpmNodeRcms` in the TLC Matrix endpoint.
- [x] 1.2 Update `worker/routes/rcm.ts` to change `innerJoin` to `leftJoin` for `bpmDiagrams` in the TLC Matrix endpoint.
- [x] 1.3 Apply similar `leftJoin` changes to the ITGC Matrix endpoint in `worker/routes/rcm.ts`.
- [x] 1.4 Add fallback logic (COALESCE or ternary) for Process/Sub-process names to use `rcms.process` and `rcms.subProcess` if diagram joins are null.

## 2. Backend Fiscal Year Filtering

- [x] 2.1 Update `/api/rcm-matrix/tlc` handler to read `year` from query parameters.
- [x] 2.2 Add `eq(rcms.year, parseInt(year))` to the where clause in the TLC Matrix endpoint.
- [x] 2.3 Update `/api/rcm-matrix/itgc` handler to read `year` from query parameters.
- [x] 2.4 Add `eq(rcms.year, parseInt(year))` to the where clause in the ITGC Matrix endpoint.

## 3. Frontend Global Context Integration

- [x] 3.1 Update `src/pages/rcm/RCMTLCPage.tsx` to use `useFiscalYearStore` to get the current `workingYear`.
- [x] 3.2 Pass `year=${workingYear}` as a query parameter in the `useQuery` call within `RCMTLCPage.tsx`.
- [x] 3.3 Update `src/pages/rcm/RCMList.tsx` (TLC and ITGC tabs) to pass the active year to child components.
- [x] 3.4 Update `src/components/rcm/ITGCTabContent.tsx` to handle year-based fetching.

## 4. Validation & Testing

- [x] 4.1 Verify that migrated RCM data (without diagram nodes) appears correctly in the Matrix TLC view.
- [x] 4.2 Verify that switching the year in the application header refreshes RCM data correctly.
- [x] 4.3 Run `npm run type-check` and `npm run lint` to ensure system integrity.
