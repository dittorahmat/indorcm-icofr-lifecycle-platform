# CSA hub data flow

Belum-Dinilai derives from existence, never from `controls.csa_status`.

- Derive: `shared/csa-worklist.ts` (`unassessedControlsFrom`, `isDraft === false` strict, `period.startsWith(year)`).
- Route: `worker/routes/csa/csa-worklist.ts` (controls ⨝ `csaRecords` + risk enrich, `GET /api/csa/worklist?year=`).
- View: `src/pages/csa/utils/use-csa-worklist.ts` (fetch key `['csa-worklist', workingYear]`, internal group/empty seam) → `CSAWorklistTab.tsx` (per-year invalidate) → `CSAPage.tsx` (`['csa-records-all', workingYear]`).
- Row: `src/pages/csa/components/csa-record-detail.ts` + `useCsaRecordDetail.ts` (dedupe `controlId||id`, `saveDual` invalidates tod/detail/worklist-year) → `CSARecordRow.tsx` + `CSARecordCard.tsx` thin adapters.
- Orchestration: `src/hooks/csa/csa-view-transition.ts` (`shouldEnterForm`, `resolvePostSaveView`, `shouldFetchList`).

Start here before touching worklist, row, or `useCSA` effects.
