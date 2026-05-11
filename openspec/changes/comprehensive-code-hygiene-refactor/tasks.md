## 1. Backend Service Refactoring

- [x] 1.1 Refactor `BpmService.updateDiagram` in `worker/services/bpm-service.ts` into smaller private methods.
- [x] 1.2 Refactor `BpmService.getDiagramById` to simplify node hydration.
- [x] 1.3 Move legacy routes from `worker/user-routes.ts` to their respective domain route files.

## 2. Frontend Hook Modularization

- [x] 2.1 Refactor `src/hooks/useCSA.ts` by extracting `useCSAForm` logic.
- [x] 2.2 Extract `useCSADiagramLink` logic from `useCSA.ts` for reuse.
- [x] 2.3 Create `src/hooks/use-bpm.ts` to encapsulate all BPM-related `useQuery` calls currently in `BPMPage.tsx`.
- [x] 2.4 Create `src/hooks/use-reports.ts` to encapsulate reporting queries from `ReportsPage.tsx`.

## 3. Component Decomposition - BPM & CSA

- [x] 3.1 Extract `BPMAccountAssertion` sub-component from `src/pages/bpm/BPMPage.tsx`.
- [x] 3.2 Extract `BPMDiagramList` from `src/pages/bpm/BPMPage.tsx`.
- [x] 3.3 Decompose `src/pages/csa/TodoListPage.tsx` into `TodoListFilters` and `TodoListGrid`.

## 4. Component Decomposition - Reports & Testing

- [x] 4.1 Decompose `src/pages/reports/ReportsPage.tsx` into `ReportDashboard`, `ReportExportPanel`, and `RegulatoryAppendicesWrapper`.
- [x] 4.2 Decompose `src/pages/testing/TestWorkbench.tsx` by moving sub-components to separate files.
- [ ] 4.3 Refactor remaining monster files identified in research (e.g., `BPMWorksheet.tsx`).

## 5. Verification & Finalization

- [ ] 5.1 Run `npm run type-check` to ensure no broken imports or type mismatches.
- [ ] 5.2 Run `npm test` to ensure all runtime safety guards and business tests pass.
- [ ] 5.3 Run `npm run lint` and `npm run build` to verify total project integrity.
- [ ] 5.4 Perform manual smoke tests on BPM diagram saving and CSA submission.
